/** @format */ // eslint-disable-line max-lines
import 'app/Review/scss/review.scss';

import { EntitySchema } from 'api/entities/entityType';
import Footer from 'app/App/Footer';
import ShowIf from 'app/App/ShowIf';
import { AttachmentsList } from 'app/Attachments';
import { CreateConnectionPanel } from 'app/Connections';
import { ConnectionsGroups, ConnectionsList } from 'app/ConnectionsList';
import { connectionsChanged, deleteConnection } from 'app/ConnectionsList/actions/actions';
import ContextMenu from 'app/ContextMenu';
import { showTab } from 'app/Entities/actions/uiActions';
import { ShowSidepanelMenu } from 'app/Entities/components/ShowSidepanelMenu';
import { I18NLink, t } from 'app/I18N';
import { Icon as PropertyIcon, TemplateLabel } from 'app/Layout';
import SidePanel from 'app/Layout/SidePanel';
import Tip from 'app/Layout/Tip';
import { MetadataForm, ShowMetadata } from 'app/Metadata';
import { RelationshipsFormButtons } from 'app/Relationships';
import AddEntitiesPanel from 'app/Relationships/components/AddEntities';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import {
  switchOneUpEntity,
  toggleOneUpFullEdit,
  toggleOneUpLoadConnections,
} from 'app/Review/actions/actions';
import { StateSelector } from 'app/Review/components/StateSelector';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { TabContent, TabLink, Tabs } from 'react-tabs-redux';
import { Action, bindActionCreators, Dispatch } from 'redux';
import { createSelector } from 'reselect';
import { PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { Icon } from 'UI';

import { OneUpState, StoreState } from '../common';

const defaultProps = {
  entity: {} as EntitySchema,
  relationships: Immutable.fromJS([]) as IImmutable<any>,
  connectionsGroups: Immutable.fromJS([]) as IImmutable<any[]>,
  templates: Immutable.fromJS([]) as IImmutable<TemplateSchema[]>,
  mlThesauri: [] as string[],
  oneUpState: {} as OneUpState,
  tab: 'info',
  selectedConnection: false,
  showTab: (_tab: string) => ({} as Action),
  connectionsChanged: () => {},
  deleteConnection: (_reference: any) => {},
  switchOneUpEntity: (_delta: number, _save: boolean) => {},
  toggleOneUpFullEdit: () => {},
  toggleOneUpLoadConnections: () => {},
};

export type OneUpEntityViewerProps = typeof defaultProps;

export interface OneUpEntityViewerState {
  panelOpen: boolean;
}

export class OneUpEntityViewerBase extends Component<
  OneUpEntityViewerProps,
  OneUpEntityViewerState
> {
  static defaultProps = defaultProps;

  static contextTypes = {
    confirm: PropTypes.func,
  };

  constructor(props: OneUpEntityViewerProps, context: any) {
    super(props, context);
    this.state = {
      panelOpen: true,
    };
    this.closePanel = this.closePanel.bind(this);
    this.openPanel = this.openPanel.bind(this);
    this.deleteConnection = this.deleteConnection.bind(this);
  }

  deleteConnection(reference: any) {
    if (reference.sourceType !== 'metadata') {
      this.context.confirm({
        accept: () => {
          this.props.deleteConnection(reference);
        },
        title: 'Confirm delete connection',
        message: 'Are you sure you want to delete this connection?',
      });
    }
  }

  closePanel() {
    this.setState({ panelOpen: false });
  }

  openPanel() {
    this.setState({ panelOpen: true });
  }

  render() {
    const {
      entity,
      tab,
      selectedConnection,
      connectionsGroups,
      relationships,
      oneUpState,
      mlThesauri,
      templates,
    } = this.props;
    const { panelOpen } = this.state;
    const selectedTab = tab ?? 'info';

    const docAttachments = entity.attachments ? entity.attachments : [];
    const attachments = entity.file ? [entity.file].concat(docAttachments) : docAttachments;

    const template: IImmutable<TemplateSchema> =
      templates.find(tmpl => tmpl.get('_id') === entity.template) ?? Immutable.fromJS({});
    const properties: IImmutable<PropertySchema[]> =
      template.get('properties') ?? Immutable.fromJS([]);
    const mlProps = properties
      .filter(p => mlThesauri.includes(p.get('content') ?? ''))
      .map(p => p.get('name'))
      .toJS();
    const nonMlProps = properties
      .filter(p => !mlThesauri.includes(p.get('content') ?? ''))
      .map(p => p.get('name'))
      .toJS();

    const summary = connectionsGroups.reduce(
      (summaryData, g: any) => {
        g.get('templates').forEach((tmpl: any) => {
          summaryData.totalConnections += tmpl.get('count'); // eslint-disable-line no-param-reassign
        });
        return summaryData;
      },
      { totalConnections: 0 }
    );

    return (
      <div className="row flex">
        <Helmet title={entity.title ? entity.title : 'Entity'} />
        <div className="content-holder">
          <main className="content-main">
            <div className="content-header content-header-entity">
              <StateSelector
                isPristine={createSelector(
                  (state: StoreState) => state.entityView.entityFormState.$form.pristine,
                  value => value
                )}
              >
                {({ isPristine = false }: { isPristine: boolean }) => (
                  <div className="content-header-title">
                    {oneUpState.reviewThesaurusName ? (
                      <I18NLink
                        to={`/settings/dictionaries/cockpit/${oneUpState.reviewThesaurusId}`}
                        className="btn btn-default"
                      >
                        <Icon icon="arrow-left" />
                        <span className="btn-label">
                          {t('System', 'Back to')}{' '}
                          <span>{`'${oneUpState.reviewThesaurusName}'`}</span>
                        </span>
                      </I18NLink>
                    ) : null}
                    {oneUpState.reviewThesaurusValues &&
                    oneUpState.reviewThesaurusValues.length === 1 ? (
                      <span className="large">
                        <span className="space8" />
                        {t('System', 'Documents including suggestion:')}{' '}
                        <b>{`'${oneUpState.reviewThesaurusValues[0]}'`}</b>
                        <span className="separator" />
                      </span>
                    ) : (
                      <span className="large">
                        <span className="space8" />
                        {t('System', 'Documents for custom filter')}
                        <span className="separator" />
                      </span>
                    )}
                    {oneUpState.totalDocs ? (
                      <div>
                        {t('System', 'Document')} <span>{oneUpState.indexInDocs + 1}</span>{' '}
                        {t('System', 'out of')}{' '}
                        <span>
                          {oneUpState.totalDocs >= oneUpState.maxTotalDocs
                            ? `>${oneUpState.totalDocs - 1}`
                            : `${oneUpState.totalDocs}`}
                        </span>
                        <span className="space8" />
                      </div>
                    ) : (
                      t('System', 'No Documents found')
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        isPristine
                          ? this.props.switchOneUpEntity(-1, false)
                          : this.context.confirm({
                              accept: () => this.props.switchOneUpEntity(-1, false),
                              title: 'Confirm discard changes',
                              message:
                                'There are unsaved changes. Are you sure you want to discard them and switch to a different document?',
                            })
                      }
                      className={
                        oneUpState.indexInDocs > 0
                          ? `btn ${isPristine ? 'btn-default' : 'btn-default btn-warning'}`
                          : 'btn btn-default btn-disabled'
                      }
                    >
                      <Icon icon="arrow-left" />
                      {/* <span className="btn-label">{t('System', 'Previous document')}</span> */}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        isPristine
                          ? this.props.switchOneUpEntity(+1, false)
                          : this.context.confirm({
                              accept: () => this.props.switchOneUpEntity(+1, false),
                              title: 'Confirm discard changes',
                              message:
                                'There are unsaved changes. Are you sure you want to discard them and switch to a different document?',
                            })
                      }
                      className={`btn ${isPristine ? 'btn-default' : 'btn-default btn-warning'}`}
                    >
                      <Icon icon="arrow-right" />
                      {/* <span className="btn-label">{t('System', 'Next document')}</span> */}
                    </button>
                  </div>
                )}
              </StateSelector>
              <button
                type="button"
                onClick={() => this.props.toggleOneUpFullEdit()}
                className={
                  oneUpState.fullEdit
                    ? 'btn btn-default btn-toggle-on'
                    : 'btn btn-default btn-toggle-off'
                }
              >
                <Icon icon={oneUpState.fullEdit ? 'toggle-on' : 'toggle-off'} />
                <span className="btn-label">{t('System', 'Full edit mode')}</span>
              </button>
            </div>
            <div className="entity-viewer">
              <Tabs selectedTab={selectedTab}>
                <TabContent
                  for={
                    selectedTab === 'info' || selectedTab === 'attachments' ? selectedTab : 'none'
                  }
                >
                  <div className="entity-metadata">
                    <ShowIf if={oneUpState.fullEdit}>
                      <MetadataForm
                        id="fullEditMetadataForm"
                        model="entityView.entityForm"
                        templateId={entity.template?.toString() ?? ''}
                        showSubset={[...nonMlProps, 'title']}
                        version="OneUp"
                      />
                    </ShowIf>
                    <ShowIf if={!oneUpState.fullEdit}>
                      <div>
                        <div className="content-header-title">
                          <PropertyIcon
                            className="item-icon item-icon-center"
                            data={entity.icon}
                            size="sm"
                          />
                          <h1 className="item-name">{entity.title}</h1>
                          <TemplateLabel template={entity.template?.toString() ?? ''} />
                          {entity.published ? (
                            ''
                          ) : (
                            <Tip icon="eye-slash">This entity is not public.</Tip>
                          )}
                        </div>
                        <ShowMetadata
                          relationships={relationships}
                          entity={entity}
                          showTitle={false}
                          showType={false}
                          showSubset={nonMlProps}
                        />
                        <AttachmentsList
                          files={Immutable.fromJS(attachments)}
                          parentId={entity._id}
                          parentSharedId={entity.sharedId}
                          isDocumentAttachments={Boolean(entity.file)}
                          entityView
                          processed={entity.processed}
                        />
                      </div>
                    </ShowIf>
                  </div>
                </TabContent>
                <TabContent for="connections">
                  <ConnectionsList
                    deleteConnection={this.deleteConnection}
                    searchCentered
                    hideFooter
                  />
                </TabContent>
              </Tabs>
            </div>
            <ShowIf if={selectedTab === 'connections'}>
              <div className="content-footer">
                <RelationshipsFormButtons />
              </div>
            </ShowIf>
            <ShowIf if={selectedTab !== 'connections'}>
              <StateSelector
                isPristine={createSelector(
                  (state: StoreState) => state.entityView.entityFormState.$form.pristine,
                  value => value
                )}
              >
                {({ isPristine = false }: { isPristine: boolean }) => (
                  <div className="content-footer">
                    <button
                      type="button"
                      onClick={() => this.props.switchOneUpEntity(0, false)}
                      className={
                        !isPristine
                          ? 'cancel-edit-metadata btn btn-default btn-danger'
                          : 'btn btn-default btn-disabled'
                      }
                    >
                      <Icon icon="undo" />
                      <span className="btn-label">{t('System', 'Discard changes')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => this.props.switchOneUpEntity(0, true)}
                      className={
                        !isPristine
                          ? 'save-metadata btn btn-default'
                          : 'btn btn-default btn-disabled'
                      }
                    >
                      <Icon icon="save" />
                      <span className="btn-label">{t('System', 'Save document')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => this.props.switchOneUpEntity(+1, true)}
                      className={
                        !isPristine
                          ? 'save-and-next btn btn-default btn-success'
                          : 'btn btn-default btn-disabled'
                      }
                    >
                      <Icon icon="save" />
                      <span className="btn-label">{t('System', 'Save and go to next')}</span>
                    </button>
                  </div>
                )}
              </StateSelector>
            </ShowIf>
            <ContextMenu
              align="bottom"
              overrideShow
              show={!panelOpen}
              className="show-info-sidepanel-context-menu"
            >
              <ShowSidepanelMenu
                className="show-info-sidepanel-menu"
                panelIsOpen={panelOpen}
                openPanel={this.openPanel}
              />
            </ContextMenu>
          </main>
          <SidePanel
            className={`entity-connections entity-${this.props.tab}`}
            open={panelOpen && !selectedConnection}
          >
            <div className="sidepanel-header content-header-tabs">
              <div className="blank" />
              <Tabs
                selectedTab={selectedTab}
                handleSelect={tabName => {
                  this.props.showTab(tabName);
                }}
              >
                <ul className="nav nav-tabs">
                  <li>
                    <TabLink to="info">
                      <Icon icon="info-circle" />
                      <span className="tab-link-tooltip">{t('System', 'Info')}</span>
                    </TabLink>
                  </li>
                  <li>
                    <TabLink to="connections">
                      <Icon icon="exchange-alt" />
                      <span className="connectionsNumber">{summary.totalConnections}</span>
                      <span className="tab-link-tooltip">{t('System', 'Connections')}</span>
                    </TabLink>
                  </li>
                </ul>
              </Tabs>
              <button
                type="button"
                className="closeSidepanel close-modal"
                onClick={this.closePanel}
              >
                <Icon icon="times" />
              </button>
            </div>
            <div className="sidepanel-body">
              <Tabs selectedTab={selectedTab}>
                <TabContent for={selectedTab === 'connections' ? selectedTab : 'none'}>
                  <ConnectionsGroups />
                </TabContent>
                <TabContent for={selectedTab === 'info' ? selectedTab : 'none'}>
                  <MetadataForm
                    id="sidePanelMetadataForm"
                    model="entityView.entityForm"
                    templateId={entity.template?.toString() ?? ''}
                    showSubset={mlProps}
                    version="OneUp"
                  />
                </TabContent>
              </Tabs>
            </div>
            <ShowIf if={selectedTab === 'connections'}>
              <StateSelector
                isPristine={createSelector(
                  (state: StoreState) => state.entityView.entityFormState.$form.pristine,
                  value => value
                )}
              >
                {({ isPristine = false }: { isPristine: boolean }) => (
                  <div className="sidepanel-footer">
                    <button
                      type="button"
                      onClick={() => this.props.toggleOneUpLoadConnections()}
                      className={isPristine ? 'btn btn-default' : 'btn btn-default btn-disabled'}
                    >
                      <Icon icon={oneUpState.loadConnections ? 'times' : 'undo'} />
                      <span className="btn-label">
                        {t(
                          'System',
                          oneUpState.loadConnections ? 'Hide Connections' : 'Load Connections'
                        )}
                      </span>
                    </button>
                  </div>
                )}
              </StateSelector>
            </ShowIf>
          </SidePanel>
          <CreateConnectionPanel
            className="entity-create-connection-panel"
            containerId={entity.sharedId}
            onCreate={this.props.connectionsChanged}
          />
          <AddEntitiesPanel />
          <RelationshipMetadata />
        </div>
        <Footer />
      </div>
    );
  }
}

const selectEntity = createSelector(
  (state: StoreState) => state.entityView.entity,
  entity => entity.toJS()
);

const selectOneUpState = createSelector(
  (state: StoreState) => state.oneUpReview.state,
  state => state?.toJS()
);

const selectMlThesauri = createSelector(
  (state: StoreState) => state.thesauris,
  thesauri =>
    thesauri
      .filter(thes => !!thes.get('enable_classification'))
      .map(thes => thes.get('_id')?.toString() ?? '')
      .toJS()
);

const mapStateToProps = (state: StoreState) => ({
  entity: selectEntity(state),
  relationships: state.entityView.entity.get('relationships'),
  connectionsGroups: state.relationships.list.connectionsGroups,
  selectedConnection: Boolean(
    state.relationships.connection && state.relationships.connection.get('_id')
  ),
  tab: state.entityView.uiState.get('tab'),
  oneUpState: selectOneUpState(state) ?? ({} as OneUpState),
  templates: state.templates,
  mlThesauri: selectMlThesauri(state),
});

function mapDispatchToProps(dispatch: Dispatch<StoreState>) {
  return bindActionCreators(
    {
      connectionsChanged,
      deleteConnection,
      showTab,
      switchOneUpEntity,
      toggleOneUpFullEdit,
      toggleOneUpLoadConnections,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(OneUpEntityViewerBase);