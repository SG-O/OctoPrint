$(function() {
    function ChangeViewModel(parameters) {
        var self = this;

        self.loginState = parameters[0];
        self.users = parameters[1];

        self.changeDialog = undefined;

        self.currentUser = ko.observable(undefined);

        self.show = function(user) {
            if (!CONFIG_ACCESS_CONTROL) return;

            if (user == undefined) {
                user = self.loginState.currentUser();
            }

            self.currentUser(user);
            self.changeDialog.modal("show");
        };

        self.done = function() {
            if (!CONFIG_ACCESS_CONTROL) return;

			self.currentUser(undefined);
			self.changeDialog.modal("hide");
        };

        self.doneEnabled = function() {
            return true;
        };

        self.onStartup = function() {
            self.changeDialog = $("#change_dialog");
        };

        self.onAllBound = function(allViewModels) {
            self.changeDialog.on('show', function() {
                callViewModels(allViewModels, "onChangeShown");
            });
            self.changeDialog.on('hidden', function() {
                callViewModels(allViewModels, "onChangeHidden");
            });
        }

    }

    OCTOPRINT_VIEWMODELS.push([
        UserSettingsViewModel,
        ["loginStateViewModel", "usersViewModel"],
        ["#usersettings_dialog"]
    ]);
});
