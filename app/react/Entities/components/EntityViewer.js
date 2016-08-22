import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import {formater} from 'app/Metadata';

export class EntityViewer extends Component {

  render() {
    return (
      <div className="row">
        <Helmet title="Entity" />
        <h3>Entity view is not yet implemented</h3>
      </div>
    );
  }

}

EntityViewer.propTypes = {
  entity: PropTypes.object
};

const mapStateToProps = (state) => {
  let entity = state.entityView.entity.toJS();
  let templates = state.templates.toJS();
  let thesauris = state.thesauris.toJS();

  return {
    entity: formater.prepareMetadata(entity, templates, thesauris)
  };
};

export default connect(mapStateToProps)(EntityViewer);