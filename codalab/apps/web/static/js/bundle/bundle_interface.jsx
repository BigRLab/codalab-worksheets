/**
 * The `Bundle` class is actually used in two places: (i) the standalone bundle
 * page and (ii) the side panel.  There is some switching logic
 */

let isStandalonePage = document.getElementById('bundle-content');

let Bundle = React.createClass({
  propTypes: {
    uuid: React.PropTypes.string.isRequired,      // uuid of bundle to load
    bundleMetadataChanged: React.PropTypes.func,  // callback on metadata change
  },

  getInitialState: function () {
    return {
      errorMessages: [],
      bundleInfo: null,
      fileContents: null,
      stdout: null,
      stderr: null,
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.uuid !== nextProps.uuid) {
      // Just clear the error messages and not the actual contents, so that in
      // the side panel, the page doesn't flicker.
      this.setState({errorMessages: []});
    }
  },

  /**
   * Return a Promise to fetch the summary of the given file.
   * @param uuid  uuid of bundle
   * @param path  path within the bundle
   * @return  jQuery Deferred object
   */
  fetchFileSummary: function (uuid, path) {
    return $.ajax({
      type: 'GET',
      url: '/rest/bundles/' + uuid + '/contents/blob' + path,
      data: {
        head: 50,
        tail: 50,
        truncation_text: '\n... [truncated] ...\n\n'
      },
      dataType: 'text',
      cache: false,
      context: this,  // automatically bind `this` in all callbacks
    });
  },

  /**
   * Fetch bundle data and update the state of this component.
   */
  refreshBundle: function () {
    // Fetch bundle metadata
    $.ajax({
      type: 'GET',
      url: '/rest/bundles/' + this.props.uuid,
      data: {
        include_display_metadata: 1,
        include: 'owner,group_permissions,host_worksheets',
      },
      dataType: 'json',
      cache: false,
      context: this,  // automatically bind `this` in all callbacks
    }).then(function (response) {
      // Normalize JSON API doc into simpler object
      const bundleInfo = new JsonApiDataStore().sync(response);
      bundleInfo.editableMetadataFields = response.data.meta.editable_metadata_keys;
      bundleInfo.metadataType = response.data.meta.metadata_type;
      this.setState({bundleInfo: bundleInfo});
    }).fail(function (xhr, status, err) {
      this.setState({bundleInfo: null, fileContents: null, stdout: null, stderr: null, errorMessages: this.state.errorMessages.concat([xhr.responseText])});
    });

    // Fetch bundle contents
    $.ajax({
      type: 'GET',
      url: '/rest/bundles/' + this.props.uuid + '/contents/info/',
      data: {
        depth: 1
      },
      dataType: 'json',
      cache: false,
      context: this,  // automatically bind `this` in all callbacks
    }).then(function (response) {
      const info = response.data;
      if (!info) return;
      if (info.type === 'file' || info.type === 'link') {
        return this.fetchFileSummary(this.props.uuid, '/').then(function (blob) {
          this.setState({fileContents: blob, stdout: null, stderr: null});
        });
      } else if (info.type === 'directory') {
        // Get stdout/stderr (important to set things to null).
        var fetchRequests = [];
        ['stdout', 'stderr'].forEach(function (name) {
          if (info.contents.some((entry) => entry.name === name)) {
            fetchRequests.push(this.fetchFileSummary(this.props.uuid, '/' + name).then(function (blob) {
              var stateUpdate = {};
              stateUpdate[name] = blob;
              this.setState(stateUpdate);
            }));
          } else {
            var stateUpdate = {};
            stateUpdate[name] = null;
            this.setState(stateUpdate);
          }
        }.bind(this));
        return $.when(fetchRequests);
      }
    }).fail(function (xhr, status, err) {
      // 404 Not Found errors are normal if contents aren't available yet, so ignore them
      if (xhr.status != 404) {
        this.setState({bundleInfo: null, fileContents: null, stdout: null, stderr: null, errorMessages: this.state.errorMessages.concat([xhr.responseText])});
      }
    });
  },

  componentDidMount: function () {
    if (isStandalonePage) {
      this.refreshBundle();
    }
  },

  render: function () {
    const bundleInfo = this.state.bundleInfo;
    if (!bundleInfo) {
      // Error
      if (this.state.errorMessages.length > 0) {
        return renderErrorMessages(this.state.errorMessages);
      }

      // Still loading
      return <div id="bundle-message" class="bundle-detail">
          <img src={`${STATIC_URL}img/Preloader_Small.gif`}/> Loading bundle...
      </div>;
    }

    const bundleMetadataChanged = isStandalonePage ? this.refreshBundle : this.props.bundleMetadataChanged;

    return (<div id="panel_content">
      {renderErrorMessages(this.state.errorMessages)}
      {renderHeader(bundleInfo, bundleMetadataChanged)}
      {renderDependencies(bundleInfo)}
      {renderContents(bundleInfo, this.state.fileContents, this.state.stdout, this.state.stderr)}
      <FileBrowser uuid={bundleInfo.uuid} />
      {renderMetadata(bundleInfo, bundleMetadataChanged)}
      {renderHostWorksheets(bundleInfo)}
    </div>);
  }
});

function renderErrorMessages(messages) {
  return <div id="bundle-error-messages">
    {messages.map(message => {
      return <div className="alert alert-danger alert-dismissable">{message}</div>;
    })}
  </div>;
}

function renderDependencies(bundleInfo) {
  var dependencies_table = [];
  if (!bundleInfo.dependencies || bundleInfo.dependencies.length == 0) return <div/>;

  bundleInfo.dependencies.forEach(function (dep, i) {
    var dep_bundle_url = "/bundles/" + dep.parent_uuid;
    dependencies_table.push(<tr>
      <td>
          {dep.child_path}
      </td>
      <td>
          &rarr; {dep.parent_name}(<a href={dep_bundle_url}>{shorten_uuid(dep.parent_uuid)}</a>){dep.parent_path ? '/' + dep.parent_path : ''}
      </td>
    </tr>);
  });

  return (<div>
    <h4>dependencies</h4>
    <table className="bundle-meta table">
      <tbody>{dependencies_table}</tbody>
    </table>
  </div>);
}

function createRow(bundleInfo, bundleMetadataChanged, key, value) {
  // Return a row corresponding to showing
  //   key: value
  // which can be edited.
  var editableMetadataFields = bundleInfo.editableMetadataFields;
  var fieldType = bundleInfo.metadataType;
  if (bundleInfo.permission > 1 && editableMetadataFields && editableMetadataFields.indexOf(key) != -1) {
    return (<tr>
      <th><span className="editable-key">{key}</span></th>
      <td><BundleEditableField canEdit={true} dataType={fieldType[key]} fieldName={key} uuid={bundleInfo.uuid} value={value} onChange={bundleMetadataChanged} /></td>
    </tr>);
  }
  else {
    return (<tr>
      <th><span>{key}</span></th>
      <td><span>{renderFormat(value, fieldType[key])}</span></td>
    </tr>);
  }
}

function renderMetadata(bundleInfo, bundleMetadataChanged) {
  var metadata = bundleInfo.metadata;
  var metadataListHtml = [];

  // FIXME: editing allow_failed_dependencies doesn't work
  // FIXME: merge with other switch statements?
  // FIXME: use simpler declarative setup instead of looping and switches?
  // Sort the metadata by key.
  var keys = [];
  for (var property in metadata) {
    if (metadata.hasOwnProperty(property))
      keys.push(property);
  }
  keys.sort();
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    metadataListHtml.push(createRow(bundleInfo, bundleMetadataChanged, key, metadata[key]));
  }

  return (<div>
    <div className="collapsible-header"><span><p>metadata &#x25BE;</p></span></div>
    <div className="collapsible-content">
      <table className="bundle-meta table">
        <tbody>{metadataListHtml}</tbody>
      </table>
    </div>
  </div>);
}

function renderHeader(bundleInfo, bundleMetadataChanged) {
  var bundleDownloadUrl = "/rest/bundles/" + bundleInfo.uuid + "/contents/blob/";
  var bundleStateClass = 'bundle-state state-' + (bundleInfo.state || 'ready');

  // Display basic information
  var rows = [];
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'uuid', bundleInfo.uuid));
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'name', bundleInfo.metadata.name));
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'description', bundleInfo.metadata.description));
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'owner', (bundleInfo.owner == null) ? '<anonymous>' : bundleInfo.owner.user_name));
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'is_anonymous', renderFormat(bundleInfo.is_anonymous, 'bool')));
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'permissions', renderPermissions(bundleInfo)));
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'created', bundleInfo.metadata.created));
  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'data_size', bundleInfo.metadata.data_size));
  if (bundleInfo.bundle_type == 'run') {
    rows.push(createRow(bundleInfo, bundleMetadataChanged, 'command', bundleInfo.command));
  }
  if (bundleInfo.metadata.failure_message) {
    rows.push(createRow(bundleInfo, bundleMetadataChanged, 'failure_message', bundleInfo.metadata.failure_message));
  }
  if (bundleInfo.bundle_type == 'run') {
    if (bundleInfo.state == 'running' && bundleInfo.metadata.run_status != 'Running')
      rows.push(createRow(bundleInfo, bundleMetadataChanged, 'run_status', bundleInfo.metadata.run_status));
    rows.push(createRow(bundleInfo, bundleMetadataChanged, 'time', bundleInfo.metadata.time));
  }

  rows.push(createRow(bundleInfo, bundleMetadataChanged, 'state', <span className={bundleStateClass}>{bundleInfo.state}</span>));
  var bundleHeader;
  if (document.getElementById('bundle-content')) {
    var bundle_name = (<h3 className="bundle-name">{bundleInfo.metadata.name}</h3>);
    bundleHeader = (
        <div className="bundle-header">
          {bundle_name}
          <div className="bundle-links">
            <a href={bundleDownloadUrl} className="bundle-download btn btn-default btn-sm" alt="Download Bundle">
              <span className="glyphicon glyphicon-download-alt"></span>
            </a>
          </div>
        </div>
    )
  }
  return (
  <div>
    {bundleHeader}
    <table className="bundle-meta table">
      <tbody>
        {rows.map(function (elem) {return elem;})}
        <tr>
          <th><span>download</span></th>
          <td>
            <div className="bundle-links">
              <a href={bundleDownloadUrl} className="bundle-download btn btn-default btn-sm" alt="Download Bundle">
                <span className="glyphicon glyphicon-download-alt"></span>
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>);
}

function renderContents(bundleInfo, fileContents, stdout, stderr) {
  var stdoutHtml = '';
  if (stdout) {
    var stdoutUrl = '/rest/bundles/' + bundleInfo.uuid + '/contents/blob/stdout';
    stdoutHtml = (<div>
      <span><a href={stdoutUrl} target="_blank">stdout</a></span>
      &nbsp;
      <span className="collapsible-header">&#x25BE;</span>
      <div className="collapsible-content bundle-meta">
        <pre>{stdout}</pre>
      </div>
    </div>);
  }

  var stderrHtml = '';
  if (stderr) {
    var stderr_url = '/rest/bundles/' + bundleInfo.uuid + '/contents/blob/stderr';
    stderrHtml = (<div>
      <span><a href={stderrUrl} target="_blank">stderr</a></span>
      &nbsp;
      <span className="collapsible-header">&#x25BE;</span>
      <div className="collapsible-content bundle-meta">
        <pre>{stderr}</pre>
      </div>
    </div>);
  }

  var contentsHtml = '';
  if (fileContents) {
    contentsHtml = (<div>
      <div className="collapsible-header"><span><p>contents &#x25BE;</p></span></div>
      <div className="collapsible-content bundle-meta">
        <pre>{fileContents}</pre>
      </div>
    </div>);
  }

  return (<div>
    {contentsHtml}
    {stdoutHtml}
    {stderrHtml}
  </div>);
}

function renderHostWorksheets(bundleInfo) {
  if (!bundleInfo.host_worksheets) return <div/>;

  var hostWorksheetRows = [];
  bundleInfo.host_worksheets.forEach(function (worksheet) {
    var hostWorksheetUrl = "/worksheets/" + worksheet.uuid;
    hostWorksheetRows.push(<tr>
      <td>
          <a href={hostWorksheetUrl}>{worksheet.name}</a>
      </td>
    </tr>);
  });

  return (<div>
    <div className="collapsible-header"><span><p>host worksheets &#x25BE;</p></span></div>
    <div className="collapsible-content">
      <div className="host-worksheets-table">
        <table className="bundle-meta table">
          <tbody>
              {hostWorksheetRows}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}

if (isStandalonePage) {
  // Extract bundle UUID from URI path.
  var uuid = window.location.pathname.match(/^\/?bundles\/([^\/]*)/i)[1];

  React.render(<Bundle uuid={uuid} />, document.getElementById('bundle-content'));
}
