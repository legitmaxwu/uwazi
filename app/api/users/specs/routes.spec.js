import userRoutes from '../routes.js';
import users from '../users.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('users routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(userRoutes);
  });

  describe('POST', () => {
    describe('/users', () => {
      it('should call users update with the body', (done) => {
        spyOn(users, 'update').and.returnValue(Promise.resolve());
        let req = {body: 'changes'};
        routes.post('/api/users', req)
        .then(() => {
          expect(users.update).toHaveBeenCalledWith('changes');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('/recoverpassword', () => {
      it('should call users update with the body email', (done) => {
        spyOn(users, 'recoverPassword').and.returnValue(Promise.resolve());
        let req = {body: {email: 'recover@me.com'}, protocol: 'http', get: () => 'localhost'};
        routes.post('/api/recoverpassword', req)
        .then(() => {
          expect(users.recoverPassword).toHaveBeenCalledWith('recover@me.com', 'http://localhost');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('/resetpassword', () => {
      it('should call users update with the body', (done) => {
        spyOn(users, 'resetPassword').and.returnValue(Promise.resolve());
        let req = {body: 'changes'};
        routes.post('/api/resetpassword', req)
        .then(() => {
          expect(users.resetPassword).toHaveBeenCalledWith('changes');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('GET', () => {
    it('should need authorization', () => {
      let req = {};
      expect(routes.get('/api/users', req)).toNeedAuthorization();
    });

    it('should call users get', (done) => {
      spyOn(users, 'get').and.returnValue(Promise.resolve(['users']));
      let req = {};
      routes.get('/api/users', req)
      .then((res) => {
        expect(users.get).toHaveBeenCalled();
        expect(res).toEqual(['users']);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    let req;
    beforeEach(() => {
      req = {query: {_id: 123, username: 'Nooooooo!'}};
      spyOn(users, 'delete').and.returnValue(Promise.resolve({json: 'ok'}));
    });

    it('should need authorization', () => {
      expect(routes.delete('/api/users', req)).toNeedAuthorization();
    });

    it('should use users to delete it', (done) => {
      return routes.delete('/api/users', req)
      .then(() => {
        expect(users.delete).toHaveBeenCalledWith(req.query._id);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
