/** @format */

import api from 'app/Thesauris/ThesaurisAPI';
import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';
import { actions } from 'app/BasicReducer';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import * as types from 'app/Thesauris/actions/actionTypes';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { RequestParams } from 'app/utils/RequestParams';

export function editThesauri(thesauri) {
  return dispatch => {
    dispatch(formActions.reset('thesauri.data'));
    dispatch(formActions.load('thesauri.data', thesauri));
  };
}

export function deleteThesauri(thesauri) {
  return dispatch =>
    api.delete(new RequestParams({ _id: thesauri._id })).then(() => {
      dispatch(actions.remove('dictionaries', thesauri));
    });
}

export function checkThesauriCanBeDeleted(thesauri) {
  return () =>
    TemplatesAPI.countByThesauri(new RequestParams({ _id: thesauri._id })).then(count =>
      count ? Promise.reject() : null
    );
}

export function reloadThesauris() {
  return dispatch =>
    api.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}

export function enableClassification(thesauri) {
  return dispatch =>
    api.save(new RequestParams(thesauri)).then(_thesauri => {
      dispatch({ type: types.THESAURI_SAVED });
      notifications.notify(t('System', 'Thesaurus saved', null, false), 'success')(dispatch);
      dispatch(formActions.change('thesauri.data', _thesauri));
    });
}

export function checkThesauriCanBeClassified(thesauri) {
  console.log('can thesauri be classified?', thesauri);
  // TODO: make this actually validate models
  return dispatch =>
    api.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}
