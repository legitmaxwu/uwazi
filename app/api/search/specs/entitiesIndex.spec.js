import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import errorLog from 'api/log/errorLog';

import { instanceSearch } from '../search';
import { fixtures as fixturesForIndexErrors } from './fixtures_elastic_errors';
import elastic from '../elastic';

const forceIndexingOfNumberBasedProperty = async search => {
  await search.indexEntities({ title: 'Entity with index Problems 1' }, '', 1);
};

const forceMappingToDouble = async elasticTesting => {
  elasticTesting.putMapping({
    properties: {
      metadata: {
        properties: {
          text_field: {
            properties: {
              value: {
                type: 'double',
                fields: {
                  raw: {
                    type: 'double',
                    index: false,
                  },
                  sort: {
                    type: 'double',
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

describe('entitiesIndex', () => {
  const elasticIndex = 'index_for_entities_index_testing';
  const search = instanceSearch(elasticIndex);
  const elasticTesting = instanceElasticTesting(elasticIndex, search);

  beforeEach(async () => {
    await db.clearAllAndLoad({});
    await elasticTesting.resetIndex();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('indexEntities', () => {
    const expectParsingException = () =>
      expect.objectContaining({
        index: expect.objectContaining({
          error: expect.objectContaining({ type: 'mapper_parsing_exception' }),
        }),
      });

    const loadFailingFixtures = async () => {
      await db.clearAllAndLoad(fixturesForIndexErrors);
      await elasticTesting.resetIndex();
      await forceMappingToDouble(elasticTesting);
      // force indexing will ensure that all exceptions are mapper_parsing. Otherwise you get different kinds of exceptions
      await forceIndexingOfNumberBasedProperty(search);
      await elasticTesting.refresh();
    };

    it('indexing without errors', async () => {
      spyOn(errorLog, 'error').and.returnValue('Ok');
      await loadFailingFixtures();
      await search.indexEntities({ title: 'Entity with index Problems 1' }, '', 1);
      expect(errorLog.error).not.toHaveBeenCalled();
      await elasticTesting.refresh();
      const indexedEntities = await search.search({}, 'en');
      expect(indexedEntities.rows.length).toBe(1);
    });

    it('should handle 1 error', async () => {
      spyOn(errorLog, 'error').and.returnValue('Ok');
      await loadFailingFixtures();
      try {
        await search.indexEntities({ title: 'Entity with index Problems 2' }, '', 1);
        fail('should have thown errors');
      } catch (err) {
        expect(err.toString()).toContain('Failed to index documents');
        expect(err.errors).toEqual([expectParsingException()]);
      }
      expect(errorLog.error).toHaveBeenCalledTimes(1);
      await elasticTesting.refresh();
      const indexedEntities = await search.search({}, 'en');
      expect(indexedEntities.rows.length).toBe(1);
    });

    /*eslint max-statements: ["error", 20]*/
    it('should index all possible entities in bulk batches and throw errors at the end', async () => {
      spyOn(errorLog, 'error').and.returnValue('Ok');
      await loadFailingFixtures();
      try {
        await search.indexEntities({});
        fail('should have thown errors');
      } catch (err) {
        expect(err.toString()).toContain('Failed to index documents');
        expect(err.errors).toEqual([
          expectParsingException(),
          expectParsingException(),
          expectParsingException(),
        ]);
      }
      expect(errorLog.error).toHaveBeenCalledTimes(1);
      await elasticTesting.refresh();
      const indexedEntities = await search.search({}, 'en');
      expect(indexedEntities.rows.length).toBe(4);
    });
  });

  describe('indexEntities by query', () => {
    const flatten = array => [].concat(...array);

    it('should only index the entities that match the query', async () => {
      await db.clearAllAndLoad({
        entities: [
          { title: 'title1', language: 'en' },
          { title: 'titulo1', language: 'es' },
          { title: 'title2', language: 'en' },
          { title: 'titulo2', language: 'es' },
          { title: 'title3', language: 'en' },
          { title: 'titulo3', language: 'es' },
          { title: 'title4', language: 'en' },
          { title: 'titulo4', language: 'es' },
          { title: 'title5', language: 'en' },
          { title: 'titulo5', language: 'es' },
        ],
      });
      await elasticTesting.reindex();
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve([]));
      await search.indexEntities({ language: 'es' }, '', 2);

      const indexedEntities = flatten(
        flatten(elastic.bulk.calls.allArgs()).map(arg => arg.body)
      ).filter(bulkElement => !bulkElement.index);

      expect(indexedEntities).toEqual([
        expect.objectContaining({ title: 'titulo1' }),
        expect.objectContaining({ title: 'titulo2' }),
        expect.objectContaining({ title: 'titulo3' }),
        expect.objectContaining({ title: 'titulo4' }),
        expect.objectContaining({ title: 'titulo5' }),
      ]);
    });
  });
});
