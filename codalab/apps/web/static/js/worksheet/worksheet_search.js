/** @jsx React.DOM */

var WorksheetSearch = React.createClass({
    // ********************************************
    // please see ws_actions the goal of WorksheetSearch
    // is to be a generic front end for all actions and select2
    // for all new actions please add in ws_actions.
    // ********************************************
    componentDidMount: function(){
        // https://github.com/jcubic/jquery.terminal
        var self = this;
        var tab_count = 0;
        var term = $('#command_line').terminal(
            // 1st argument is handle commands entered
            function(command, term) {
                // lets clean and cut up what the enterd
                command = command.trim(); // cut of any extra whitespace
                var args = command.split(' '); //command.get_command().split(' ')
                command = args[1]; // the command they enterd, minus cl
                var last = args[args.length-1];

                console.log("entered command");
                console.log(command);
                console.log(args);
                console.log("******* PARSE AND RUN *********");
                if(typeof(command) == 'undefined'){  // no command
                    return;
                }
                ws_action_command = ws_actions.checkAndReturnCommand(command);
                if(typeof(ws_action_command) == 'undefined'){  // no command
                    //didnt find anything take all extra
                    // throw it in cl command and hope for the best
                    ws_action_command = ws_actions.checkAndReturnCommand('cl');
                    ws_action_command.executefn(args, term); // todo promise
                }else{ // we have a ws_action lets use it.
                    ws_action_command.executefn(args, term); // todo promise
                }
                if(command == 'time'){
                    term.pause()
                    setTimeout(function(){
                        term.resume();
                        term.echo("<h3>response</h3>", {raw:true});
                    }, 3000);
                }

            },
            // 2nd is helpers and options. Take note of keydown for tab completion
            {
                greetings: 'Worksheet Interface: A codalab cli lite interface. Please enter a command or help to see list of commands',
                name: 'command_line',
                height: 145,
                prompt: '> ',
                history: true,
                keydown: function(event, terminal){
                    if(event.keyCode == 27){ //esc
                        terminal.focus(false);
                    }
                    if (event.keyCode == 9){ //Tab
                        ++tab_count;
                        var command;  // the ws_action command
                        var entered = term.get_command();
                        var args = entered.split(' '); //term.get_command().split(' ')
                        var last = args[args.length-1];
                        console.log('completion')
                        console.log(entered);
                        console.log(args);
                        console.log(last);
                        console.log('-------------------');

                        if(args[0] != 'cl'){ // shove in cl, just some helpful sugar
                            term.set_command('cl ' + entered);
                        }

                        var auto_complete_list;
                        if(args.length > 2 && args[1]){
                            command = ws_actions.checkAndReturnCommand(args[1]);
                            auto_complete_list = command.autocomplete(last) // todo handle ajax blocking // todo promise
                        }else{
                            auto_complete_list = ws_actions.getCommands(self.props.canEdit); // todo promise
                        }

                        var regex = new RegExp('^' + $.terminal.escape_regex(last));
                        var matched = [];
                        // push all found auto_complete_list in to matched for more tricks
                        for (var i=auto_complete_list.length; i--;) {
                            if (regex.test(auto_complete_list[i])) {
                                matched.push(auto_complete_list[i]);
                            }
                        }
                        // now for the insert or print out
                        if(matched.length === 1){ // we found an exact match, just put in in the term
                            term.insert(matched[0].replace(regex, '') + ' ');
                        }else if (matched.length > 1) {
                            if (tab_count >= 2) {
                                // TODO fancy ouput, not just \t
                                // term.echo("<a href='http://google.com'>a link</a>", {raw: true});
                                term.echo(matched.join('\t'));
                                tab_count = 0;
                            } else {
                                // lets find what matches and fill in as much as we can if not a full match
                                // example: test123 and testabc are comp words, type `te`, hit tab,
                                //          we can complete to `test` based on matchs
                                var found = false;
                                var found_index;
                                var j;
                                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label
                                loop: // dont stop till found, because it is guaranteed from before, thanks matched
                                    for (j=last.length; j<matched[0].length; ++j) {
                                        for (i=1; i<matched.length; ++i) {
                                            if (matched[0].charAt(j) !== matched[i].charAt(j)) {
                                                break loop;
                                            }
                                        }
                                        found = true;
                                    }
                                    if (found) {
                                        term.insert(matched[0].slice(0, j).replace(regex, ''));
                                    }
                            }
                        }// end if else if
                        return false; // dont really hit tab
                    }else{// end if 9 aka tab, reset the counter
                        tab_count = 0;
                    }

                },
                onBlur: function(term){
                    term.resize(term.width(), 45);
                    self.props.handleBlur();
                },
                onFocus: function(term){
                    term.resize(term.width(), 150);
                    self.props.handleFocus();
                },
                // completion: function (term, string, callback){
                //     console.log('completion')
                //     console.log(string);
                //     console.log(term.get_command());
                //     var args = term.get_command().split(' ')
                //     var last = args[args.length-2];
                //     console.log(args);
                //     console.log(last);
                //     console.log('-------------------');
                //     var hints = ['test', 'whatever']
                //     if(last == "info"){
                //         hints = [
                //             '0x4d2d43753ede4c819df3584cc64944b1|pugbug.png|francis',
                //             '0x8cd3d83b83f44c6e848f6e5ae1a8079f|sort.py|francis',
                //             '0xf4128f189a0c43af9e3afa7bd731c6c6|mlcomp.py|percy',
                //             '<h1>0x8680a5b13478402ca063706d2de35f25|some_data_set|erick</h1>',
                //             '0xc1757edeb84144ee9697ebbe90d422a5|anotherprogram|francis',
                //             '0xG4d2d43753ede4c819df3584cc64944b1|pugbug.png|francis',
                //             '0xG8cd3d83b83f44c6e848f6e5ae1a8079f|sort.py|francis',
                //             '0xGf4128f189a0c43af9e3afa7bd731c6c6|mlcomp.py|percy',
                //             '0xG8680a5b13478402ca063706d2de35f25|some_data_set|erick',
                //             '0xGc1757edeb84144ee9697ebbe90d422a5|anotherprogram|francis',
                //         ];
                //     }
                //     callback(hints);
                //     // no to clean up if we selected something
                //     var new_args = term.get_command().split(' ')
                //     var new_last = new_args[new_args.length-2];
                //     if(new_last == last){
                //         // nothing to do
                //     }else{
                //         //clean up and replace it
                //         new_last = new_last.split('|')[0]
                //         new_args[new_args.length-2] = new_last
                //         term.set_command(new_args.join(' '));
                //     }
                // },
            }
        );
        //turn off focus by default
        term.focus(false);
        term.focus(true); // todo remove

        // $('#search').select2({
        //     multiple:true,
        //     minimumInputLength: function(){
        //         var input = $('#search').val();
        //         var command = ws_actions.checkAndReturnCommand(input);
        //         if(command){
        //             if(command.hasOwnProperty('minimumInputLength')){
        //                 return command.minimumInputLength;
        //             }else{
        //                 return 0;
        //             }
        //         }
        //         //sane defaults
        //         switch(input){
        //             case '':
        //                 return 0;
        //             default:
        //                 return 3;
        //         }
        //     },
        //     maximumSelectionSize:function(){
        //         var input = $('#search').val();
        //         var command = ws_actions.checkAndReturnCommand(input);
        //         if(command){
        //             if(command.hasOwnProperty('maximumSelectionSize')){
        //                 if($.isFunction(command.maximumSelectionSize)){
        //                     return command.maximumSelectionSize();
        //                 }else{
        //                     return command.maximumSelectionSize;
        //                 }
        //             }else{
        //                 return 0;
        //             }
        //         }
        //         //sane defaults
        //         return 0;
        //     },
        //     formatSelection: function(item){
        //         return item.id;
        //         // When you search for a command, you should see its name and a description of what it
        //         // does. This comes from the command's helpText in the command dict.
        //         // But after you make a selection, we only want to show the relevant command in the command line
        //     },

        //     // custom query method, called on every keystroke over the min length
        //     // see http://ivaynberg.github.io/select2/#doc-query
        //     createSearchChoice: function(term){
        //         var input = $('#search').val();
        //         var command = ws_actions.checkAndReturnCommand(input); // will return undefined if doesnt exist.
        //         if(command){
        //             if(command.hasOwnProperty('searchChoice')){
        //                 // { id: term, text: 'helper text you"ve entered term' };
        //                 return command.searchChoice(command, term);
        //             }
        //         }
        //     },
        //     query: function(query){
        //         // Select2 is masking the actual #search field. Its value only changes when something new is entered
        //         // via select2. So when the value of #search changes, we know we need to reevaluate the context
        //         // in which select2 is being used (eg, we've gone from entering a command to looking up a bundle)
        //         var input = query.element.val();
        //         // if there's something in the commandline AND
        //         // if the last thing entered in the command line is in our known list of commands,
        //         // we know we need to start hitting the API for results
        //         var command = ws_actions.checkAndReturnCommand(input);
        //         if(input.length && command ){
        //             // get our action object that tells us what to do (ajax url)
        //             if(command.hasOwnProperty('queryfn')){
        //                 command.queryfn(query);
        //             }else{ // no query fn, just fall back to nothing
        //                 query.callback({
        //                     results: []
        //                 });
        //             }
        //         }else{
        //             // either a command hasn't been entered or it wasn't one we support, so
        //             // let's make a list of our known commands
        //             // console.log('searching commands...');
        //             var commands = ws_actions.getCommands(self.props.canEdit);
        //             var matchedOptions = [];
        //             commands.map(function(item){
        //                 // we need to make our own matcher function because we're doing this
        //                 // custom thing. This is just a reimplementation of select2's default
        //                 // matcher. See http://ivaynberg.github.io/select2/#doc-matcher
        //                 if(item.id.toUpperCase().indexOf(query.term.toUpperCase())>=0){
        //                     matchedOptions.push(item);
        //                 }
        //             });
        //             console.log(matchedOptions.length + ' results');
        //             // now pass back these results the same way we did the ajax ones
        //             query.callback({
        //                 results: matchedOptions
        //             });
        //         }// end of else
        //     }
        // }).on('select2-open', function(){
        //     // because select2 is masking the actual #search field, we need to manually trigger
        //     // its focus event when select2 is invoked
        //     self.props.handleFocus();
        // }).on('select2-close', function(){
        //     // because select2 is masking the actual #search field, we need to manually trigger
        //     // its blur event when select2 is invoked
        //     self.props.handleBlur();
        // });

        // $('#s2id_search').on('keydown', '.select2-input', function(e){
        //     // add some custom key events for working with the search bar
        //     switch(e.keyCode){
        //         case 9: // tab
        //             // usually the Tab key would move focus off the search input, so
        //             // we want to prevent that
        //             e.preventDefault();
        //             break;
        //         case 13: // enter
        //             // cmd-enter or ctrl-enter triggers execution of whatever is
        //             // in the search input
        //             e.preventDefault();
        //             self.executeCommands();
        //             break;
        //         case 27:
        //             var input = $('#search').select2('val');
        //             if(input.length){
        //                 return;
        //             }else{ // nothing blur it
        //                 this.blur();
        //             }

        //         default:
        //             return true;
        //     }
        // });

    },
    componentWillUnmount: function(){
        // when the component unmounts, destroy the select2 instance
        // $('#search').select2('destroy');
    },
    componentDidUpdate: function(){
        // if(this.props.active){
        //     $('#s2id_autogen1').focus();
        // }else {
        //     $('#s2id_autogen1').blur();
        // }
    },
    refreshAndClear: function(){
        // this.props.refreshWorksheet();
        // $('#search').select2('val','').val('');
    },
    executeCommands: function(){
        // parse and execute the contents of the search input
        // var input = $('#search').select2('val'); // this comes in as an array
        // // customization can be done here, depending on the desired syntax of commands.
        // // currently, this just calls all of the functions named in the input
        // var entered_command = input[0];
        // var command = ws_actions.checkAndReturnCommand(entered_command);
        // if(command){
        //     command.executefn(input, ws_actions.commands[entered_command], this.refreshAndClear);
        // } else {
        //     console.error('The command \'' + entered_command + '\' was not recognized');
        // }
    },
    render: function(){
        // <div className="input-group">
        //                 <input id="search" placeholder="Click here or press '/' to start" />
        //                 <span className="input-group-btn">
        //                     <button className="btn btn-default" type="button" onClick={this.executeCommands}>Go</button>
        //                 </span>
        //             </div>
        return (
            <div className="ws-search">
                <div className="container">
                    <div id="command_line" ></div>
                </div>
            </div>
        )
    }
});
