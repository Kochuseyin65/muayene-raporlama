``` javascript

            (function () {
    
            this.Signer = function () {
    
            // Option defaults
    
            var defaults = {

            userCertificateEndpoint: "http://localhost:61812/api/Sign/GetUserCertificate",

            signEndpoint: "http://localhost:61812/api/Sign/Sign",

            signOnDeviceEndpoint: "http://localhost:61812/api/Sign/SignOnDevice",

            userCertificate: null, // User's public certificate

            onAppNotStarted: null, // This will be triggered when the wpf app is not run on the client machine

            onSmartCardNotFound: null // This will be triggered when a smartcard couldn't be found

        };



        // Override defaults with the passed in arguments (if any)

        if (arguments[0] && typeof arguments[0] === "object") {

            extendDefaultsObj = arguments[0];

        }

        else {

            extendDefaultsObj = {};

        }

        this.options = extendDefaults(defaults, extendDefaultsObj);

    };



    // Public Methods

    Signer.prototype.sign = function (textOrTextArray, pin, callbackUrl, successCallback, errorCallback) {

        // Validate and normalize input

        if (!pin) {

            console.error("Pin cannot be empty");

            return;

        }

        if (!textOrTextArray) {

            console.error("Text cannot be empty");

            return;

        }

        if (!successCallback) {

            console.warn("Sign callback is not supplied");

        }

        if (typeof textOrTextArray == "string") {

            var contentList = [textOrTextArray];

        }

        else {

            var contentList = textOrTextArray;

        }



        // Get user certificate if it's empty

        if (!signer.options.userCertificate) {

			signer.initUserCert(function () {

				Signer.prototype.sign(textOrTextArray, pin, callbackUrl, successCallback, errorCallback);

            });

            return;

        }



        // Prepare and send the request

        var params = {

			PIN: pin,

			CallbackUrl: callbackUrl,

            Base64ContentList: contentList

        };

        var signSuccessCallback = function (response) {

            if (successCallback !== null) {

                successCallback(response);

            }

        };

        post(signer.options.signEndpoint, params, signSuccessCallback, errorCallback, signer.options.onAppNotStarted);

    };



    Signer.prototype.signOnDevice = function (urlToFile, entityId, userId, signatureNo, fileType, pin, azureSasUrl, serverCallbackUrl, successCallback, errorCallback) {

     

        if (!pin) {

            console.error("Pin cannot be empty");

            return;

        }



        if (!successCallback) {

            console.warn("Sign callback is not supplied");

        }



        // Get user certificate if it's empty

        if (!signer.options.userCertificate) {

            signer.initUserCert(function () {

                Signer.prototype.signOnDevice(urlToFile, entityId, userId, signatureNo, fileType, pin, azureSasUrl, serverCallbackUrl, successCallback, errorCallback);

            });

            return;

        }



        // Prepare and send the request

        var params = {

            PIN: pin,

            UserId: userId,

            EntityId: entityId,

            UrlToFile: urlToFile,

            AzureSasUrl: azureSasUrl,

            ServerCallbackUrl: serverCallbackUrl,

            SignatureNo: signatureNo,     

            FileType: fileType,     

            Base64UserCertificate: signer.options.userCertificate

        };



        var signSuccessCallback = function (response) {

            if (successCallback !== null) {

                successCallback(response);

            }

        };



        post(signer.options.signOnDeviceEndpoint, params, signSuccessCallback, errorCallback, signer.options.onAppNotStarted);

    };



    Signer.prototype.initUserCert = function (successCallback, errorCallback) {

        // Prepare callbacks

        var signer = this;

        var onSuccess = function (response) {

            signer.options.userCertificate = response.Base64UserCertificate;

            if (successCallback) {

                successCallback();

            }

        };

        var onError = function (response) {

            if (signer.options.onSmartCardNotFound) {

                onSmartCardNotFound();

            }

            if (errorCallback) {

                errorCallback();

            }

        };



        // Send request to get the user certificate and cache it for future purposes

        get(signer.options.userCertificateEndpoint, onSuccess, onError, signer.options.onAppNotStarted);

    };



    // Private Methods

    // Helper method to override defaults with user options

    function extendDefaults(source, properties) {

        var property;

        for (property in properties) {

            if (properties.hasOwnProperty(property)) {

                source[property] = properties[property];

            }

        }

        return source;

    }



    // Helper method to get data with XHR

    function get(url, successCallback, errorCallback, unreachableEndpointCallback) {

        // Ready the request

        var xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);

        xhr.onreadystatechange = function () {

            if (xhr.readyState == 4 && xhr.status == 200 && successCallback) {

                successCallback(JSON.parse(xhr.response));

            }

            else if (xhr.readyState == 4 && xhr.status == 0 && unreachableEndpointCallback) {

                unreachableEndpointCallback();

            }

            else if (xhr.readyState == 2 && xhr.status == 500 && errorCallback) {

                errorCallback();

            }

        };



        // Send

        xhr.send(null);

    }



    // Helper method to post data with XHR

    function post(url, params, successCallback, errorCallback, unreachableEndpointCallback) {

        // Ready the request

        var xhr = new XMLHttpRequest();

        xhr.open("POST", url, true);

        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

        xhr.onreadystatechange = function () {

            if (xhr.readyState == 4 && xhr.status == 200 && successCallback) {

                if (xhr.response)

                    successCallback(JSON.parse(xhr.response));

                else

                    successCallback();

            }

            else if (xhr.readyState == 4 && xhr.status == 0 && unreachableEndpointCallback) {

                unreachableEndpointCallback();

            }

            else if (xhr.readyState == 2 && xhr.status == 500 && errorCallback) {

                errorCallback();

            }

        };



        // Send

        xhr.send(JSON.stringify(params));

    }

}());

``` 