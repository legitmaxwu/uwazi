import db from 'api/utils/testing_db';
import thesauris from 'api/thesauris';
import translations from 'api/i18n';
import settings from 'api/settings';

import CSVLoader from '../csvLoader';
import fixtures from './fixtures';
import { stream } from './helpers';

describe('csvLoader thesauri', () => {
  const loader = new CSVLoader();

  afterAll(async () => db.disconnect());

  let thesauriId;
  describe('load thesauri', () => {
    beforeAll(async () => {
      await db.clearAllAndLoad(fixtures);

      await translations.addLanguage('es');
      await settings.addLanguage({ key: 'es', label: 'spanish' });

      await translations.addLanguage('fr');
      await settings.addLanguage({ key: 'fr', label: 'french' });

      const { _id } = await thesauris.save({ name: 'thesauri2Id', values: [{ label: 'existing value' }] });

      const nonExistent = 'Russian';

      const csv = `English, Spanish, French  , ${nonExistent}  ,
                   value 1, valor 1, valeur 1, 1               ,
                   value 2, valor 2, valeur 2, 2               ,
                   value 3, valor 3, valeur 3, 3               ,`;


      thesauriId = _id;
      await loader.loadThesauri(stream(csv), _id, { language: 'en' });
    });

    const getTranslation = async lang =>
      (await translations.get())
      .find(t => t.locale === lang)
      .contexts.find(c => c.id === thesauriId.toString()).values;

    it('should set thesauri values using the language passed and ignore blank values', async () => {
      const thesauri = await thesauris.getById(thesauriId);
      expect(thesauri.values.map(v => v.label)).toEqual(['existing value', 'value 1', 'value 2', 'value 3']);
    });

    it('should translate thesauri values to english', async () => {
      const english = await getTranslation('en');

      expect(Object.keys(english).length).toBe(5);

      expect(english.thesauri2Id).toBe('thesauri2Id');
      expect(english['existing value']).toBe('existing value');
      expect(english['value 1']).toBe('value 1');
      expect(english['value 2']).toBe('value 2');
      expect(english['value 3']).toBe('value 3');
    });

    it('should translate thesauri values to spanish', async () => {
      const spanish = await getTranslation('es');

      expect(Object.keys(spanish).length).toBe(5);

      expect(spanish.thesauri2Id).toBe('thesauri2Id');
      expect(spanish['existing value']).toBe('existing value');
      expect(spanish['value 1']).toBe('valor 1');
      expect(spanish['value 2']).toBe('valor 2');
      expect(spanish['value 3']).toBe('valor 3');
    });

    it('should translate thesauri values to french', async () => {
      const french = await getTranslation('fr');

      expect(Object.keys(french).length).toBe(5);

      expect(french.thesauri2Id).toBe('thesauri2Id');
      expect(french['existing value']).toBe('existing value');
      expect(french['value 1']).toBe('valeur 1');
      expect(french['value 2']).toBe('valeur 2');
      expect(french['value 3']).toBe('valeur 3');
    });
  });
});
