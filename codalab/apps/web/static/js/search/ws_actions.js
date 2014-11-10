// Singleton class to manage actions triggered by the general search bar
function WorksheetActions() {
    var instance;
    WorksheetActions = function WorksheetActions(){
        return instance;
    };
    WorksheetActions.prototype = this;
    instance = new WorksheetActions();
    instance.constructor = WorksheetActions();

    instance.commands = {
        // Dictionary of terms that can be entered into the search bar
        // and the names of functions they call.
        'add': {
            functionName: 'doAdd',
            helpText: 'add - add a bundle to this worksheet name or uuid',
            url: '/api/bundles/search/'
        },
        'info': {
            functionName: 'doInfo',
            helpText: 'info - go to a bundle\'s info page',
            url: '/api/bundles/search/'
        }
    };

    instance.getCommands = function(){
        // The select2 autocomplete expects its data in a certain way, so we'll turn
        // relevant parts of the command dict into an array it can work with
        commandDict = this.commands;
        commandList = [];
        for(var key in commandDict){
            commandList.push({
                'id': key,
                'text': commandDict[key].helpText
            });
        }
        return commandList;
    };

    instance.doAdd = function(params, command){
        var bundleID = params[1];
        var worksheetID = ws_obj.state.uuid;
        alert('Make a call to the cli to add the bundle with UUID ' + bundleID +
            ' to this worksheet, which has the UUID ' + worksheetID);
    };

    instance.doInfo = function(params, command){
        window.location = '/bundles/' + params[1] + '/';
    };

    return instance;
}