$(function() {
    function ChangeViewModel(parameters) {
        var self = this;

        self.loginState = parameters[0];
		self.temperatureViewModel = parameters[1];
		self.settingsViewModel = parameters[2];
		
		self.toolTemp = ko.observable(0);
		
		self.temperature_profiles = self.settingsViewModel.temperature_profiles;
		self.tools = self.temperatureViewModel.tools;
		
		self.setTargetFromProfile = function(item, profile) {
            if (!profile) return;
			self.toolTemp(profile.extruder);
        };

        self.show = function(user) {
            if (!CONFIG_ACCESS_CONTROL) return;
            if (user == undefined) {
                user = self.loginState.currentUser();
            }
            self.changeDialog.modal("show");
        };

        self.done = function() {
            if (!CONFIG_ACCESS_CONTROL) return;
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
        ChangeViewModel,
        ["loginStateViewModel", "temperatureViewModel", "settingsViewModel"],
        ["#change_dialog"]
    ]);
});
