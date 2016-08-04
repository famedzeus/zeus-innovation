// Angular watcher
// G.R Nov 2014
// Written in native javascript as we cannot bind in the Angular $digest as that's what we're interrogating
// and I don't want jquery as a dependency
var angularWatcher = function($scope) {
    
	var angularWatches = {};
    var element = null;
    var showBindings = false;
	var showInvocations = false;
    var traversing = false;
    var bindCount = 0;
    var bindings = [];
    var windowHeight = 300;
	var traversalCount = 0;

    var addWatch = function(w) {
        angularWatches[w] = w;      
    };
    
    var toggleBindings = function() { 
    	this.showBindings = !this.showBindings; 
    };
    
    var toggleInvocations = function() { 
    	this.showInvocations = !this.showInvocations; 
    };
    
    var updateWatches = function($rootScope){
		
		var appModule = $rootScope.appModule;
		target = $rootScope;
		
		if(this.element) {
			
			//adjustedHeight = this.showBindings ? this.windowHeight : 200;
			//this.element.style.top = window.pageYOffset + (window.innerHeight - adjustedHeight) + "px";

			dirty = false;
			current = target;

			var dirtyCount = 0;
			var bindCount = 0;
			this.bindings = [];
			var indent = "";
			var scopeChain = "$scope";
			
			traversalCount++;
			
			traverseScopesLoop:
			do { // "traverse the scopes" loop

				if ((watchers = current.$$watchers)) {

                   
					// process our watches
					length = watchers.length;

					  while (length--) {
						try {
						  watch = watchers[length];
							
						  if (watch) {
							if(watch.last) {
								
								var objectDetails = "";
								var type = typeof watch.last
								if(type == "object") {
									for(var props in watch.last){
										objectDetails += props + ",";
									}
								}
								if(type == "string")
								{
									var binding = watch.last
									if(watch.last.indexOf("html") != -1)
										type = "ng-include";
									if(watch.last.indexOf("http") != -1)
										type = "url";
									if(watch.last.indexOf("#/") != -1)	
										type = "routing";
									objectDetails = "View:\"" + binding + "\"";
								}
								
								if(watch.get(current)!=watch.last) {
									dirtyCount++;
								}
								
								this.bindings.push({type:type,value:watch.last,details:objectDetails,
													status:watch.get(current)!=watch.last,scopes:scopeChain});
								bindCount++;							
								
							}
						  }
						} catch (e) {
						  console.log(e);
						}
					  }

				}

				// Insanity Warning: scope depth-first traversal
				if (!(next = (current.$$childHead ||
					(current !== target && current.$$nextSibling)))) {
				  while(current !== target && !(next = current.$$nextSibling)) {
					current = current.$parent;
					scopeChain += "-->parent";
					//indent += "parent";
					//current = null;
					//break;
				  }
				  
				 if(next == current.$$nextSibling)
				 	scopeChain += "-->sibling";
				  
				}
				} while ((current = next));

				var html = "<h3>Angular watcher    v2.0</h3>";
				html += "<h4>Page bindings</h4>";
				html += "<table>";
				html += "<tr><td><b>Bindings : " + bindCount + "</b></td><td><b>Traversals:" + traversalCount + "</b></td>";
				html += "<td><b>Total dirty:" + dirtyCount + "</b></td>";
				html += "<td><input onclick=\"javascript:angularWatcher.toggleBindings();\" type=\"button\" value=\"Binding details\"></input></tr>";
				
				if(this.showBindings){
					html += "<tr><th width=\"10%\">Type</th>";
					html += "<th width=\"10%\">Value</th>";
					html += "<th width=\"10%\">Dirty</th>";
					//html += "<th width=\"10%\">Scope chain</th>";
					html += "<th width=\"60%\">Details</th></tr>";
					if(bindCount < 2000) {
						html += "<tr>";
						for(var w in this.bindings) {
							html += "<td style=\"max-width:100px\"><b>" + this.bindings[w].type + "</b></td>";
							html += "<td style=\"max-width:100px\">" + this.bindings[w].value + "</td>";
							html += "<td style=\"max-width:100px\">" + this.bindings[w].status + "</td>";
							//html += "<td style=\"max-width:100px\">" + this.bindings[w].scopes + "</td>";
							
							html += "<td style=\"max-width:500px\">";
							if(this.bindings[w].details){
								html += " " + this.bindings[w].details;
							}
							html += "</td></tr>";
						}
					}
				}
				html += "</table>";
					
				// Run through invocation chain
				html += "<h4>Invocation chain</h4>";
				html += "<table>";
				html += "<tr><td><b>Total controllers : " + appModule._invokeQueue.length + "</b></td><td>Application module:<b>" + appModule.name + "</b>";

				html += " injects <br /><b>" + appModule.requires + "</b>";
				html += "<input onclick=\"javascript:angularWatcher.toggleInvocations();\" type=\"button\" value=\"Invocation details\"></input>";

				if(this.showInvocations) {

					html += "<tr><th>Controller</th><th>Injected dependencies</th></tr>";
					for(var i in appModule._invokeQueue) {
						if(typeof appModule._invokeQueue[i] != 'function') {
							html += "<tr><td>" + appModule._invokeQueue[i][2][0] + "</td>";
							// Dependencies
							html += "<td>";
							for(var j in appModule._invokeQueue[i][2][1]) {
								if(typeof appModule._invokeQueue[i][2][1][j] != 'function') {
									html += appModule._invokeQueue[i][2][1][j] + ",";
								}
							}
							html += "</td></tr>";
						}
					}
				}
				
				html += "</table>";
				this.element.innerHTML = html;		
				this.traversing = false;
				
				if(bindCount > 10000)
					this.element.style.backgroundColor = "#ffaaaa";
				if(bindCount > 1000 && bindCount < 10000)
					this.element.style.backgroundColor = "#ffa800";
				if(bindCount < 1000)
					this.element.style.backgroundColor = "#aaffaa";
		}        
    };
    
    return {
        
        update:updateWatches,
        element:element,
		windowHeight:windowHeight,
		showBindings:showBindings,
		toggleBindings:toggleBindings,
		showInvocations:showInvocations,
		toggleInvocations:toggleInvocations
    }

}();

document.addEventListener("DOMContentLoaded", function(event) { 
	var el = document.createElement('div');
	document.body.appendChild(el);
	angularWatcher.element = el;
	el.id = "angular-watcher";
	var doc = document.documentElement;
	var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

});
