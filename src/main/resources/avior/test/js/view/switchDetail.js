define([
	"jquery",
	"underscore",
	"backbone",
	"marionette",
	"floodlight/featuresFl",
	"floodlight/switchStatisticsFl",
	"view/switchSummary", // should rename this, maybe SwitchSummary?
	"collection/switchCollection",
	"model/description",
	"collection/portCollection",
	"floodlight/portFl",
	"model/port",
	"model/portStatistics",
	"floodlight/flowModFl",
	"view/flowEditor",
	"floodlight/flowCollectionFl",
	"text!template/switchContainer.html",
	"text!template/switchHeading.html",
	"text!template/description.html",
	"text!template/portTable.html",
	"text!template/portRow.html",
	"text!template/flowTable.html",
	"text!template/flowEntry.html",
], function($, _, Backbone, Marionette, Features, SwitchStats, SwitchSummary, SwitchCollection, Description, PortCollection, PortFL, Port, PortStatistics, FlowMod, FlowEditor, FlowCollection, swtchContainer, header, descrip, portFrame, portRow, flowFrame, flowRow){
	var SwitchesSumView = Backbone.View.extend({
		itemView: SwitchSummary,
		
		el: $('#content'),
			
		template1: _.template(swtchContainer),
		template2: _.template(header),
		template3: _.template(descrip),
		template4: _.template(portFrame),
		template5: _.template(portRow),
		template6: _.template(flowFrame),
		template7: _.template(flowRow),
		currentDPID: '',
			
		// construct a new collection with switch info from server
		// and render this collection upon sync with server 	
		initialize: function(item){
			var self = this;
			this.subnets = new Array;
			this.collection = new SwitchCollection();
			this.collection.fetch();
			features = new Features();
			features.fetch();
			switchStats = new SwitchStats();
			switchStats.fetch();	
			this.listenTo(switchStats, "sync", this.render);
			//$('#pleaseWork').click(function(e) {self.clickSwitch(e);});
		},
		
		events: {
			"click #loadswtch": "refresh",
			"click #flowMod": "modFlows",
			//"click h3.ui-collapsible-heading": "clickSwitch",
			"click a.dpidLink": "clickSwitch",
			"click #removeFlo": "deleteFlow",
		},
		
		// render the heading and table template, 
		// then render each model in this.collection
		render: function() {
		    // hack to turn template HTML into object without yet adding it to document
		    var switchList = $('<div/>').html(this.template1).contents();
			var self = this;
			// one concern about this forEach is that it will happen every time this view is rendered
			_.forEach(self.collection.models, function(item) {
						var dp = item.get("dpid");
						item.set("features", features.get(dp));
						item.set("switchStatistics", switchStats.get(dp));
						item.set("id", item.get("dpid"));
  						self.renderSwitch(item, switchList);
					}, this);

			this.$el.html(this.template2).trigger('create');
			switchList.appendTo(this.$el).trigger('create');
			return this;
		},
		
		//display the dpid list
		renderSwitch: function(item,container){
			var switchSum = new SwitchSummary({
				model: item
			});
			container.append(switchSum.render().el);
		},
		
		//clear the container div, create 
		//description model and port model
		//for specific dpid and place in view
		clickSwitch: function(e) {
			console.log("clickSwitch");
			$('#container').remove();
			
			var oneSwitch = this.collection.get(e.currentTarget.id);
			var dpid = oneSwitch.get("dpid");
			this.currentDPID = dpid;
			
			this.displayDesc(dpid, oneSwitch);
			
			this.displayPorts(dpid, oneSwitch);
			
			this.displayFlows(dpid);
		},
		
		//attach switch description info to page
		displayDesc: function(dpid, oneSwitch){
			var desc = new Description(oneSwitch.get("description"));
			desc.set("dpid", dpid);
			desc.set("connectedSince", oneSwitch.get("connectedSince"));	
			this.$el.append(this.template3(desc.toJSON())).trigger('create');	
		},
		
		//attach port info to page
		displayPorts: function(dpid, oneSwitch){
			$('#con3').append(this.template4());
			var ports = new PortCollection();
			var portArray = oneSwitch.get("ports");
			var portStatArray = new PortStatistics(dpid);
			var self = this;
			
			//get port statistics, append as a submodel to port model
			//and append port model to port collection
			portStatArray.fetch().complete(function () {
				var numPorts = 0;
				_.forEach(portArray, function(item) {
					var p = new Port(item);
					p.set("portStatistics", portStatArray.get(dpid)[numPorts]);
        			ports.add(p);
        			numPorts += 1;
        		}, this);
        		
        		_.forEach(ports.models, function(item) {
					$('#portTable').append(self.template5(item.toJSON()));
					//console.log(JSON.stringify(item));
        		}, this);
        		oneSwitch.set("portModel", ports);
        
    	 	});
		},
		
		//attach flow info to page
		displayFlows: function(dpid){
			$('#container1').append(this.template6());
			//console.log("here's DPID");
			//console.log(dpid);
			var self = this;
			var flows = new FlowCollection(dpid);
			flows.fetch().complete(function () {
				//console.log("Attempted to fetch flows");
				_.forEach(flows.models, function(item) {
					//console.log("Item stringified =======================");
					//console.log(JSON.stringify(item));
					//console.log("Item regular ===========================");
					//console.log(item);
					$('#flowTable').append(self.template7(item.toJSON()));
				}, this);
			});
			
			//console.log("done with displayFlows()");
			// Construct table with flow information
			
			
		},
		
		//updates this.collection, features and switchStats
		//with the latest switch info from server
		refresh: function(){
			features.fetch();
			this.collection.fetch();
			switchStats.fetch();
		},
		
		modFlows: function () {
			//$('#container1').remove();
			new FlowEditor(this.collection, true);
		},
		
		deleteFlow: function(e) {
			var v = e;
			console.log(v);
			console.log("delete a flow!");
			//$('#container').remove();
			this.flowEditor = new FlowEditor(this.collection, false);
			this.flowEditor.deleteFlow("red");
		},
		
	});
	return SwitchesSumView;
});
