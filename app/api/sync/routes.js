import multer from 'multer';

import { models } from 'api/odm';
import path from 'path';
import search from 'api/search/search';

import { needsAuthorization } from '../auth';
import paths from '../config/paths';

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.normalize(`${paths.uploadedDocuments}/`));
  },
  filename(_req, file, cb) {
    cb(null, file.originalname);
  },
});

const indexEntities = async req => {
  if (req.body.namespace === 'entities') {
    await search.indexEntities({ _id: req.body.data._id }, '+fullText');
  }

  if (req.body.namespace === 'files') {
    await search.indexEntities({ sharedId: req.body.data.entity }, '+fullText');
  }
};

const deleteFileFromIndex = file => search.indexEntities({ sharedId: file.entity });

const deleteEntityFromIndex = async entity => {
  try {
    await search.delete(entity);
  } catch (err) {
    if (err.statusCode !== 404) {
      throw err;
    }
  }
};

const deleteFromIndex = async (req, file) => {
  if (req.query.namespace === 'entities') {
    await deleteEntityFromIndex({ _id: JSON.parse(req.query.data)._id });
  }

  if (file) {
    await deleteFileFromIndex(file);
  }
};

export default app => {
  const upload = multer({ storage });

  app.post('/api/sync', needsAuthorization(['admin']), async (req, res, next) => {
    try {
      if (req.body.namespace === 'settings') {
        const [settings] = await models.settings.get({});
        req.body.data._id = settings._id;
      }

      await (Array.isArray(req.body.data)
        ? models[req.body.namespace].saveMultiple(req.body.data)
        : models[req.body.namespace].save(req.body.data));

      await indexEntities(req);

      res.json('ok');
    } catch (e) {
      next(e);
    }
  });

  app.post('/api/sync/upload', needsAuthorization(['admin']), upload.any(), (_req, res) => {
    res.json('ok');
  });

  app.delete('/api/sync', needsAuthorization(['admin']), async (req, res, next) => {
    try {
      let file;
      if (req.query.namespace === 'files') {
        file = await models[req.query.namespace].getById(JSON.parse(req.query.data)._id);
      }

      await models[req.query.namespace].delete(JSON.parse(req.query.data));

      if (req.query.namespace === 'entities' || file) {
        await deleteFromIndex(req, file);
      }

      res.json('ok');
    } catch (e) {
      next(e);
    }
  });
};
