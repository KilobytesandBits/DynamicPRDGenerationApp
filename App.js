Ext
		.define(
				'CustomApp',
				{
					extend : 'Rally.app.App',
					componentCls : 'app',

					launch : function() {
						this._createMilestoneWaspiDataStore();
					},

					/**
					 * Create the WASPI Data Store for Milestone
					 */
					_createMilestoneWaspiDataStore : function() {
						Ext.getBody().mask('Loading...');
						console.log("Rally.environment.getContext().getProject()._ref : ", Rally.environment.getContext().getProject()._ref);

						// Create filter based on settings selection
						var filter;

						filter = Ext.create('Rally.data.wsapi.Filter', {
							property : 'TargetProject',
							operator : '=',
							value : Rally.environment.getContext().getProject()._ref
						});

						milestoneWaspiDataStore = Ext.create('Rally.data.wsapi.Store', {
							model : 'Milestone',
							autoLoad : true,
							compact : false,
							context : {
								workspace : Rally.environment.getContext().getWorkspace()._ref,
								project : Rally.environment.getContext().getProject()._ref,
								projectScopeUp : false,
								projectScopeDown : true
							},
							filters : filter,
							fetch : [ 'ObjectID', 'FormattedID', 'Name', 'TargetDate', 'TargetProject', 'c_ActiveStartDate' ],
							limit : Infinity,
							listeners : {
								load : function(store, data, success) {
									if (data.length > 0) {
										this._createMilestoneDataStore(data);
									} else {
										Rally.ui.notify.Notifier.showError({
											message : 'No Milestone is associated with the selected Project.'
										});
									}
									Ext.getBody().unmask();
								},
								scope : this
							},
							sorters : [ {
								property : 'Name',
								direction : 'ASC'
							} ]
						});
					},

					/**
					 * Convert the WASPI Data Store for Milestone to
					 * Ext.data.Store
					 */
					_createMilestoneDataStore : function(myData) {

						var milestoneArr = [];

						Ext.each(myData, function(data, index) {
							var milestone = {};
							milestone.ObjectID = data.data.ObjectID;
							milestone.FormattedID = data.data.FormattedID;
							milestone.Name = data.data.Name;
							milestone.TargetDate = data.data.TargetDate;
							milestone.TargetProject = data.data.TargetProject;
							milestone.ActiveStartDate = data.data.c_ActiveStartDate;
							milestoneArr.push(milestone);
						});

						this.milestoneDataStore = Ext.create('Ext.data.Store', {
							fields : [ 'ObjectID', 'FormattedID', 'Name', 'TargetDate', 'TargetProject', 'ActiveStartDate' ],
							data : milestoneArr
						});
						this._createMilestonePicker();
					},

					/**
					 * Create the Ext.form.ComboBox for the Milestone
					 */
					_createMilestonePicker : function() {
						this.milestonePicker = Ext.create('Ext.form.ComboBox', {
							fieldLabel : 'Milestone ',
							store : this.milestoneDataStore,
							renderTo : Ext.getBody(),
							displayField : 'Name',
							queryMode : 'local',
							valueField : 'ObjectID',
							border : 1,
							style : {
								borderColor : '#000000',
								borderStyle : 'solid',
								borderWidth : '1px',
								height : '40px'
							},
							width : 400,
							padding : '10 5 5 10',
							margin : '10 5 5 10',
							shadow : 'frame',
							labelAlign : 'right',
							labelStyle : {
								margin : '10 5 5 10'
							},
							listeners : {
								select : function(combo, records, eOpts) {
									this.selectedMilestone = combo.getValue();
									this.selectedMilestoneObj = records;
									this._getMileStoneData();
								},
								scope : this
							}
						});
						this.add(this.milestonePicker);
					},

					/**
					 * Get the milestone data to create the doc
					 */
					_getMileStoneData : function() {

						filter = Ext.create('Rally.data.wsapi.Filter', {
							property : 'ObjectID',
							operator : '=',
							value : this.selectedMilestone
						});

						milestoneWaspiDataStore = Ext.create('Rally.data.wsapi.Store', {
							model : 'Milestone',
							autoLoad : true,
							compact : false,
							context : {
								workspace : Rally.environment.getContext().getWorkspace()._ref,
								project : Rally.environment.getContext().getProject()._ref,
								projectScopeUp : false,
								projectScopeDown : true
							},
							filters : filter,
							fetch : [ 'ObjectID', 'FormattedID', 'Name', 'TargetDate', 'TargetProject', 'c_ActiveStartDate', 'Notes' ],
							limit : Infinity,
							listeners : {
								load : function(store, data, success) {
									if (data.length > 0) {
										this._generateDoc(data);
									} else {
										Rally.ui.notify.Notifier.showError({
											message : 'No Milestone is associated with the selected Project.'
										});
									}
									Ext.getBody().unmask();
								},
								scope : this
							},
							sorters : [ {
								property : 'Name',
								direction : 'ASC'
							} ]
						});
					},

					/**
					 * Generate doc using milestone data
					 */
					_generateDoc : function(milestoneData) {

						var data = this._generateData(milestoneData[0].data);

						var tpl = new Ext.XTemplate(

								'<div style="font-size: medium;font-family: arial, Verdana, sans-serif"><h1 style="text-align : center;">Product Requirements Document (PRD)</h1>',

								'<br/><br/><br/>',

								'<table><tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Product Name:</span><td> <td>{FormattedID} - {Name}</td></tr>',
								'<tr><td colspan=2>&nbsp;</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Date:</span><td> <td>{CurrentDate}</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Contact:</span><td> <td>{userName}</td></tr>',
								'</table>',

								'<div style="font-size: small; font-family: arial, Verdana, sans-serif"" <p style="page-break-before: always;">&nbsp;</p>',
								'<p style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Document Revision History:</p>',

								'<table style="border-collapse: collapse; border: 1px solid black; width: 590px;"><tr><th style="border: 1px solid black;">&nbsp;Date&nbsp;</th><th style="border: 1px solid black;">&nbsp;Revision&nbsp;</th><th style="border: 1px solid black;">&nbsp;Description&nbsp;</th><th style="border: 1px solid black;">&nbsp;Author&nbsp;</th></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;{CurrentDate}&nbsp;</td><td style="border: 1px solid black;">&nbsp;0.1&nbsp;</td><td style="border: 1px solid black;">&nbsp;Initial PRD&nbsp;</td><td style="border: 1px solid black;">&nbsp;{userName}&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;&lt;Enter date&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;#.&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;Descibe Changes.&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;Enter Name.&gt;&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>',
								'</table>',

								'<p style="page-break-before: always;">&nbsp;</p>',

								'<ol>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Overview <br/> </h2>',
								'<ol>',
								'<li>',
								'<h3>Document Objective</h3>',
								'<p>The Product Requirements Document (PRD) provides a complete requirements definition of a product, based on the market requirements.  The PRD describes the features of a product without regard to implementation. </p>',
								'</li>',
								'<li>',
								'<h3>General description</h3>',
								'<p>{Notes}</p>',
								'</li>',
								'</ol>',
								'</li>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Product Features <br/> </h2>',

								'</li>', '</ol>',

								'</div> </div>');

						if (this.down('#doc-container') !== null) {
							this.down('#doc-container').destroy();
						}

						this.add({
							xtype : 'container',
							id : 'doc-container',
							html : tpl.apply(data)
						});
					},

					/**
					 * Generate data to populate in template
					 */
					_generateData : function(milestoneData) {
						var data = {};

						data.FormattedID = milestoneData.FormattedID;
						data.Name = milestoneData.Name;
						data.CurrentDate = Ext.Date.format(new Date(), 'd-M-Y');
						data.userName = this.getContext().getUser().DisplayName;
						data.Notes = milestoneData.Notes.split("<li>").join('').split("</li>").join('<br>');

						console.log(data);

						return data;
					}
				});
