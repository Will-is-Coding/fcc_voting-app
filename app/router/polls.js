'use strict';
var express = require('express');
var router  = express.Router();

var pollHandler = require('../middleware/pollHandler.js');
var auth        = require('../middleware/auth.js');


/*****************************
 * 
 * All routes pertain to interactions with polls
 * Routes are prefaced by /api/poll
 * 
 ****************************/

//Fetch all polls in database
router.get('/fetchAll', pollHandler.fetchAllPolls);

//Create a poll
router.put('/new', auth.requireToken, pollHandler.createPoll);

//Fetch the polls created by the current user
router.get('/user', auth.requireToken, pollHandler.fetchUserPolls);

//Interact with a poll
router.route('/:id')
        .get(pollHandler.fetchSinglePoll)                       								//Fetch single poll
        .put(auth.requireToken, pollHandler.checkAuthorization, pollHandler.editPollOptions)    //Add and/or remove options of the poll as the creator
        .delete(auth.requireToken, pollHandler.checkAuthorization, pollHandler.deletePoll);     //Delete the poll

router.put('/:id/visibility', auth.requireToken, pollHandler.checkAuthorization, pollHandler.changePollVisiblity); //Make a poll private or public

//Editing the votes of a poll
router.route('/:id/vote/:option')
        .put(pollHandler.submitVote)                            //Adds single vote to poll
        .delete(auth.requireToken, pollHandler.removeUserVote); //Removes single vote from poll

//Remove all votes on the poll
router.delete('/:id/votes', auth.requireToken, pollHandler.checkAuthorization, pollHandler.removeAllVotes);

//Interact with a poll's options
router.route('/:id/option/:option')
        .put(auth.requireToken, pollHandler.uniqueOptions, pollHandler.addOption)   //Add an option to the poll as a user
        .delete(auth.requireToken, pollHandler.removeOption);   					//Remove previously added option of user

    
module.exports = router;