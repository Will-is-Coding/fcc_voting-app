'use strict';
(function() {
	/*************************************
	 * 
	 * TODO: 
	 * Check if admin
	 * Check upper and lowercase creator name and username
	 * When fetching all polls, only return those that are not secret
	 * 
	 * 
	 * 
	 * **********************************/
    var moment = require('moment');

    var Poll = require('../models/poll.js');

    var validOption = function(option) {
		var validStringRegEx = /([A-Za-z0-9])+/;
		if( option && validStringRegEx.exec(option) !== null && option.length <= 50)
			return true;
		else
			return false;
	};

	var validateQuestionAndOptions = function(question, options) {
		var validStringRegEx = /([A-Za-z0-9])+/;
		var validPoll = false;
		var validOptions = false;

		if( options.length === 1 )
			return { options: validOption(options[0]) };

		else if( question && validStringRegEx.exec(question) !== null && question.length > 1 ) {
			validPoll = true;
			options = options.filter(function(item, i, ar){ return ar.indexOf(item) === i; }); //Make sure unique options
			if( options.length > 1) {
				for( var i = 0; i < options.length; i++ ) {
					if( options[i] && validStringRegEx.exec(options[i]) !== null && options[i].length <= 50 ) {
						validOptions = true;
					}
					else
						break;
				}
			}
		}
		console.log( validPoll + ' ' + validOptions );
		return { poll: validPoll, options: validOptions };
	};

	var canAddOpt = function(curOpts, newOpt, user, admin, creator) {

			var optIndexIfUserAdded = curOpts.findIndex( option => option.addedBy === user );
			var newOptionIndex = curOpts.findIndex( option => option.vote.toLowerCase() === newOpt.toLowerCase() && option.vote.length === newOpt.length );

        	if( newOptionIndex === -1 ) {
        		if( optIndexIfUserAdded === -1 )
        			return true;
    			else if( admin || creator )
    				return true;
				else
					return false;
        	}

        	return false;
	};

	var removePollOptions = function(poll_id, optionsToRemove, res) {

		Poll.findByIdAndUpdate(poll_id, {
			$pull: {
				"options": {
					_id: {
						$in: optionsToRemove
					}
				}
			}
		}, { new: true },
		function(err, poll) {
			if( err ) {
				res.status(304).json({message: "Error removing options", error: err, success: false});
				throw err;
			}
			else {
				res.status(200).json({message: "Successfully edited poll options.", success: true, options: poll.options});
			}
		});
	};

	/** Create valid new options to push into the poll **/
	var createNewOptions = function(toCreate) {
		var newOptions = [];
		toCreate = toCreate.filter( function(item, i, ar ) { return ar.indexOf(item) === i; }); //Make sure there are no repeats
		console.log(toCreate);
		for( var i = 0; i < toCreate.length; i++ ) {
			if( toCreate[i] !== undefined && toCreate[i].length > 0)
				newOptions.push({ count: 0, vote: toCreate[i] });
		}
		return newOptions;
	};

    /******************
     *
     * Begin middleware for poll API
     *
     ******************/
    module.exports = {

        createPoll: function(req, res) {
            Poll.findOne({ question: req.body.question, question_lower: req.body.question.toLowerCase() }, function(err, poll) {

				if(err)
					res.status(200).json({message: "Error checking for poll existance", success: false, pollSuccess: false, optionsSuccess: false});

				else if( poll === null ) {
					var validPoll = validateQuestionAndOptions(req.body.question, req.body.options);

					if( validPoll.poll && validPoll.options ) {
						var craftedOptions = createNewOptions(req.body.options);

						var createdPoll = new Poll({
							question: req.body.question,
							question_lower: req.body.question.toLowerCase(),
							voters: [],
							options: craftedOptions,
							creationDate: { unix: moment().unix(), human: moment().format("MMM DD, YYYY") },
							secret: req.body.secret
						});

						createdPoll.creator.name = req.username;
						createdPoll.creator.authenticated = true;
						createdPoll.creator.ipaddress = req.headers['x-forwarded-for'];

						createdPoll.save( function(err) {
							if (err) {
								res.status(200).json({ err: err, message: "Failed to create your poll", success: false, pollSuccess: false, optionsSuccess: false });
								throw err;
							}
							else
								res.status(201).json({poll_id: createdPoll._id, message: "Successfully created your poll", success: true, pollSuccess: true, optionsSuccess: true });
						});

					}
					else if( validPoll.poll && !validPoll.questions ) {
						res.status(200).json({message: "You need at least two valid options for the poll", success: false, pollSuccess: true, optionsSuccess: false});
					}
					else if( !validPoll.poll && validPoll.questions ) {
						res.status(200).json({message: "You need a valid poll question, with at least 4 characters", success: false, pollSuccess: true, optionsSuccess: false});
					}
					else {
						res.status(200).json({message: "Both the options and poll question are invalid", success: false, pollSuccess: false, optionsSuccess: false});
					}
				}
				else
					res.status(200).json({message: "This poll already exists", success: false, pollSuccess: false, optionsSuccess: true});
			});
        },

        fetchAllPolls: function(req, res) {
            Poll.find({}).exec( function(err, results) {
				if (err) {
					res.status(200).json(err);
					throw err;
				}
				console.log(req.signedIn);
				res.status(200).json({polls: results, ipaddress: req.ipaddress});
			});
        },

        fetchSinglePoll: function(req, res) {
        	Poll.findOne({_id: req.params.id}, function(err, result) {
				if (err) throw err;

				res.status(200).json({poll: result, ipaddress: req.ipaddress});
			});
        },

        fetchUserPolls: function(req, res) {
            Poll.find({ 'creator.name': req.username }, function(err, polls) {
            	if( err ) {
            		res.status(200).json({error: err});
            		throw err;
            	}
				res.status(200).json(polls);
			});
        },

        submitVote: function(req, res) {
			/** Search and attain the poll and specific vote to increment vote count and push ipaddress for validation. Checks if the ipaddres and user has not voted before **/
			//if( req.username ) {
				Poll.findOneAndUpdate(
					{ _id: req.body._id, "options._id" : req.body.option_id, "options.vote": req.body.vote, "voters.username": { $ne: req.username }, "voters.ipaddress": { $ne: req.ipaddress } },
					{
						$inc : { "options.$.count" : 1 },
						$push:
						{
							'voters':
							{
								'username': req.username,
								'ipaddress': req.ipaddress,
								'votedFor_id': req.body.option_id
							}
						}

					},
					{ new: true },
					function(err, poll) {
						console.log(poll);

						if (err)
							throw err;

						if( poll === null )
							res.status(200).json({success: false, message: "You already voted! One vote per user/ipaddress" });
						else {
							res.status(200).json({success: true, message: "Vote has been submitted.", voted: req.body.vote, options: poll.options});
						}
					});
		//	}
			/** If client not logged in, check against ipaddress **/
			/*else {
				Poll.findOneAndUpdate(
					{ _id: req.body._id, "options._id" : req.body.option_id, "options.vote": req.body.vote, "voters.ipaddress": { $ne: ipaddress } },
					{
						$inc : { "options.$.count" : 1 },
						$push:
						{
							'voters':
							{
								'ipaddress': ipaddress,
								'votedFor_id': req.body.option_id
							}
						}
					},
					{ new: true },
					function(err, poll) {
						console.log(poll);

						if (err)
							throw err;

						if( poll === null )
							res.status(200).json({submitted: false, message: "You already voted!" });
						else
							res.status(200).json({submitted: true, message: "Vote has been submitted.", voted: req.body.vote, options: poll.options});
					});
			}*/
        },

        removeUserVote: function(req, res) {
            Poll.findOneAndUpdate( {_id: req.params.id, "options._id" : req.params.option },
				{
					$inc: {
						"options.$.count": -1
					},
					$pull: {
						voters: { $in: [req.username, req.ipaddress] }
					}
				}, {new: true}, function(err, poll) {
					if( err ) {
						res.status(200).json({error: err, success: false});
						throw err;
					}
					if( poll ) {
						console.log(poll.voters);
						res.status(200).json({message: "Removed your vote", success: true, options: poll.options});
					}
					else
						res.status(200).json({message: "Error updating poll", success: false});
				});
        },

		/** Check if the user is either the creator of the poll or an admin **/
        checkAuthorization: function(req, res, next) {
        	//TODO: CHECK IF USER IS ADMIN
        	Poll.findOne( { _id: req.params.id, "creator.name": req.username } ,
        	function(err, poll) {
        		if(err) {
        			res.status(200).json({error: err, success: false});
        			throw err;
        		}

        		if(poll) {
        			req.creator = true;
        			next();
        		}
        		else {
        			req.creator = false;
        			next();
        			//res.status(200).json({message: "You must be the creator or an admin to edit the poll", submitted: false});
        		}
        	});
        },

        removeAllVotes: function(req, res) {
        		
        	if( req.creator || req.admin ) {
            	Poll.findById(req.params.id, function(err, poll) {
            		if(err) {
	        			res.status(200).json({error: err, success: false});
	        			throw err;
        			}
        			
        			if(poll) {
        				
        				for( var i = 0; i < poll.options; i++ ) {
        					poll.options[i].count = 0;
        				}
        				
        				poll.save(function(err) {
        					if(err) {
        						res.status(200).json({error: err, success: false});
        						throw err;
        					}
        					
        					res.status(200).json({message: "Successfully cleared votes", success: true});
        				});
        			}
        			else 
        				res.status(200).json({message: "Couldn't find poll", success: false});
            	});
        	}
        	else
        		res.status(200).json({message: "Must be an admin or the creator of the poll to clear the votes", success: false});
        },

		/** Check unique option if single; Check unique options if in set of new options **/
        uniqueOptions: function(req, res, next) {
    		Poll.findById(req.params.id, function(err, poll) {
				if(err) {
					res.status(200).json({error: err, success: false});
				}

				if(poll) {
					if( req.body.vote ){
						var optIndex =  poll.options.findIndex( option => option.vote.toLowerCase() === req.body.vote.toLowerCase() && option.vote.length === req.body.vote.length );

						if(optIndex === -1)
							next();
						else
							res.status(200).json({message: "This option is already available", success: false});
					}
					else if(req.body.newOptions) {
						var newOpts = [];
						for(var i = 0; i < req.body.newOptions; i++) {
							if( req.body.newOptions.lastIndexOf(req.body.newOptions[i]) === i )
								newOpts.push(req.body.newOptions[i]);
						}
						req.body.newOptions = newOpts;
						next();
					}
					else
						next();
				}
			});
        },

        /** Add or/and remove options from a poll as the creator **/
        editPollOptions: function(req, res) {
        	if( req.creator || req.admin ) {
	            if( req.body.removedOptions || req.body.newOptions ) {
					var totalOptionsLength = req.body.options.length + req.body.newOptions.length;
					if( totalOptionsLength > 1 ) {
						if( req.body.newOptions && req.body.newOptions.length > 0 ) {
							if( validateQuestionAndOptions("options only", req.body.newOptions).options ) {
								var formattedOptions = createNewOptions(req.body.newOptions);
	 
								/** Add new options to poll **/
								Poll.findByIdAndUpdate( req.params.id, {
									$push: {
										"options": {
											$each: formattedOptions
										}
									}
								}, { new: true },
								function(err, poll) {
									if( err ) {
										res.status(304).json({message: "Error adding options", error: err, success: false});
										throw err;
									}
									if( poll !== null ) {
										if( req.body.removedOptions && req.body.removedOptions.length > 0 )
											removePollOptions(poll._id, req.body.removedOptions, res);
										else
											res.status(200).json({message:"Successfully added options", success: true, options: poll.options});
									}
									else
										res.status(200).json({message:"Error finding or adding to poll", success: false});
								});
							}
							else
								res.status(200).json({message: "Invalid new options", success: false});
						}
						else
							removePollOptions( req.params.id, req.body.removedOptions, res );
					}
					else
						res.status(200).json({message: "A poll must have at least two options", success: false});
				}
				else
					res.status(200).json({message:"Must have options to add or remove", success: false});
        	}
        	else
        		res.status(200).json({message: "You must be the creator or an admin to edit the poll", success: false});
        },

        /** Delete specific poll if user is the creator or an admin **/
        deletePoll: function(req, res) {
        	if( req.creator || req.admin ) {
	            Poll.findById(req.params.id, function(err, poll) {
					if( err ) {
						res.status(200).json({error: err, success: false});
						throw err;
					}
					
					if(poll) {
						poll.remove();
						res.status(200).json({message: "Successfully deleted poll", success: true});
					}
					else {
						res.status(200).json({message: "Could not find the poll", success: false});
					}
				});
        	}
        	else
    			res.status(200).json({message: "Failed to delete poll. You must be the creator or an admin.", success: false});
        },

        addOption: function(req, res) {
        	
            var optIndexIfUserAdded = req.body.options.findIndex( option => option.addedBy === req.username );
			var isUniqueOption = req.body.options.findIndex( option => option.vote.toLowerCase() === req.body.vote.toLowerCase() );

			if( validOption(req.body.vote) && isUniqueOption === -1 ) {
				if( optIndexIfUserAdded === -1 || req.body.creator.toLowerCase() === req.username.toLowerCase() ) {

					Poll.findByIdAndUpdate( req.params.id, {
						$push: {
							"options": {
								"vote": req.body.vote,
								"count": 0,
								"addedBy": req.username
							}
						}
					}, { new: true },
					function(err, poll) {
						if( err ) {
							res.status(200).json({error: err, success: false});
						}
						res.status(201).json({message: "Option Added", success: true, options: poll.options });
					});

				}
				else
					res.status(200).json({message: "You've already added an option", success: false});
			}
			else
				res.status(200).json({message: "Not a valid option", success: false});
        },

        removeOption: function(req, res) {
            Poll.findOneAndUpdate({ _id: req.params.id, "options.addedBy": req.username, "options._id": req.params.option },
			{
				$pull: {
					options: {
						_id: req.params.option,
						addedBy: req.username
					},
					voters: {
						votedFor_id: req.params.option
					}
				}
			}, {new: true},
			function(err, poll) {
				if( err ) {
					res.status(200).json({error: err, success: false});
					throw err;
				}
				if( poll ) {
					res.status(200).json({message: "Succesfully removed your option", success: true, options: poll.options, voters: poll.voters});
				}
				else
					res.status(200).json({message: "Option not found or not the creator", success: false});
			});
        },
        
        changePollVisiblity: function(req, res) {
        	if( req.creator || req.admin ) {
        		Poll.findByIdAndUpdate(req.params.id, {secret: req.body.isPrivate}, function(err, poll) {
        			if( err ) {
						res.status(200).json({error: err, success: false});
						throw err;
					}
					
					if( poll ) {
						res.status(200).json({message: "Successfully changed poll's visibility", success: true});
					}
					else
						res.status(200).json({message: "Could not find poll to change visibility", success: false});
        		});
        	}
        	else
        		res.status(200).json({message: "You must be the creator or an admin to change the visibility", success: false});
        }


    };
})();