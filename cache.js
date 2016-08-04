
/**
 * @ngdoc function
 * @name coreServices.Cache
 * 
 * @description
 * Though angular has it's own specific storage module we made our own,
 * partly due to not realising that one already existed but mostly due to
 * wanting the ability to easily modify the behaviour of the service.
 * 
 * The basic functionality of the `Cache` service is that it saves, loads and
 * deletes objects using html5 `Storage`.
 * 
 * If client being used doesn't support html5 `sessionStorage` or `localStorage`
 * then the factory will return a dummy object with the same provided methods 
 * which will always just return null; 
 * 
 */
angular.module('coreServices').factory('Cache', [function () {
	function isInt(value) {
		   return !isNaN(value) && parseInt(value) == value;
	}
	// return mock object for browsers without Storage
    if (!sessionStorage || !localStorage) {
    	return {
    		saveObject: function () { return null; },
    		fetchObject: function() { return null; },
    		deleteObject: function() { return null; }
    	};
    }
    var uniqueKey = '';
    var lastPage = '';
    var navigatedFromCopy = false;
  /*  var sessionStorageSpace = function(){
        var allStrings = '';
        for(var key in window.sessionStorage){
            if(window.sessionStorage.hasOwnProperty(key)){
                allStrings += window.sessionStorage[key];
            }
        }
        return allStrings ? 3 + ((allStrings.length*16)/(8*1024)) + ' KB' : 'Empty (0 KB)';
    };*/

    
	/**
     * @ngdoc method
     * @name coreServices.Cache:#saveObject
     * @methodOf coreServices.Cache
     *
     * @description
     * Saves an object to `Storage`.  Whether `sessionStorage` or the longer term `localStorage`
     * is dependent upon whether the user supplies an expiration time, if not it will default
     * to `sessionStorage`.
     *
     * @param {string} key A unique string to be supplied which can later be used to retreive the saved object.
     * @param {Object} obj A javascript object to be saved.
     * @param {integer} expirationTime How long (in milliseconds) to store this object in `localStorage` for, this allows for data to be kept
     * for a much longer or shorter term. 
     * 
     */
    var saveObject = function (key, obj, expirationTime) {
        if (obj.dateSaved  === undefined) {
            obj.dateSaved = new Date().getTime();
        }
        if (expirationTime !== undefined && isInt(expirationTime)) {
        	obj.dateExpire = expirationTime;
        	return localStorage.setItem(uniqueKey + key, JSON.stringify(obj));
        }
        //console.log(uniqueKey + key)
        return sessionStorage.setItem(uniqueKey + key,JSON.stringify(obj));
    };

	/**
     * @ngdoc method
     * @name coreServices.Cache:#fetchObject
     * @methodOf coreServices.Cache
     *
     * @description
     * Fetches an object from html5 `Storage` via unique key identifier.
     * 
     * By default it returns the object from `sessionStorage`. If not in `sessionStorage`
     * it will check `localStorage` to see if object has been placed in storage for a predefined
     * amount of time.  If an object is found, it will then check to see if it has expired or not, if
     * it has then it will be deleted and return null elsewise it will fetch the stored object.
     *
     *
     * @param {string} key A unique string to be supplied which is used to try to retreive a saved object.
     * 
     */
    var fetchObject = function (key) {
    	var localObj,
    		sessionObj = JSON.parse(sessionStorage.getItem(uniqueKey+key));
    	// return object from session cache
    	if (sessionObj != null) {
    		return sessionObj;
    	}
    	// check if object exists in localStorage(longer term storage)
    	localObj = JSON.parse(localStorage.getItem(uniqueKey+key));
    	if (!localObj)
    		return null;
    	var timeDiff = new Date().getTime() - localObj.dateSaved;
    	// check if our object is expired
    	if (timeDiff > localObj.dateExpire) {
    		deleteObject(uniqueKey+key);
    		return null;
    	}

        return (JSON.parse(localStorage.getItem(uniqueKey+key)));
    };
    
    var key = sessionStorage.getItem('uniqueKeyLocation');
    if (key) {
    	uniqueKey = key;
    }

    /**
     * @ngdoc method
     * @name coreServices.Cache:#deleteObject
     * @methodOf coreServices.Cache
     *
     * @description
     * Deletes any objects which are stored with this key value, both in `localStorage` and `sessionStorage`
     *
     * @param {string} key A unique string to be supplied which is used to try to find and delete a saved object.
     * 
     */
    var deleteObject = function (key) {
    	sessionStorage.removeItem( uniqueKey +key);
    	localStorage.removeItem( uniqueKey + key);
    };

    return {
        saveObject: saveObject,
        fetchObject: fetchObject,
        deleteObject: deleteObject,
        setUniqueKey: function (key) {
        	uniqueKey = key;
        	
        	sessionStorage.setItem('uniqueKeyLocation',  key );
        }
    };
}]);