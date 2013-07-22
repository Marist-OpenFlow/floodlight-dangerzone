define([
	"model/flowMod"
], function(FlowMod){
	//push flows! and delete flows!
	FlowMod.prototype.urlRoot = function () {
		if (this.dpid === "null"){
			this.unset(this.dpid);
			return "/wm/staticflowentrypusher/json";
		}
		else
			return "/wm/staticflowentrypusher/clear/" + this.dpid + "/json";
	};
	 
	FlowMod.prototype.initialize = function(dpid) {this.dpid = dpid;};
    
    
    //overriding the pre-existing destroy method
    //to send data along with the delete request
    //and also to ignore whether or not the model
    //being deleted is new
    FlowMod.prototype.destroy =  function(options) {
    	console.log(options.data);
    	console.log("destroy");
    	
    	//properly formats data for back-end to parse
    	if ( options.data ) {
            options.data = JSON.stringify(options.data);
        }
        
     	var model = this;
      	var success = options.success;

      	var destroy = function() {
        	model.trigger('destroy', model, model.collection, options);
      	};

      	options.success = function(resp) {
        	model.trigger('sync', model, resp, options);
      	};

      	var xhr = this.sync('delete', this, options);
      
      	return xhr;
    };
    
	return FlowMod;
});