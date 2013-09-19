//Global config for gigya api functions
var custom_gigya = {};

//Gigya functions are usually gigya_method(global_conf, params)
//Some param fields are specific to certain calls, but some common ones are:
//	provider - string - which provider to send this call to
//	callback - function - function to call when this request is done
//	cid - string - context id, used for data tracking on gigya admin page
//	context - object - programmer-provided object that is passed back to callback unchanged

Drupal.behaviors.custom_gigya_init = function(context){
	//Fill in global config
	//Needed to wait until Drupal.settings stuff was filled in
	custom_gigya.conf = {
		APIKey: Drupal.settings.custom_gigya.APIKey
	};
};

function gigya_refresh_user_info(){
	gigya.services.socialize.getUserInfo(custom_gigya.conf, {callback: gigya_user_info_change});
}

function gigya_user_info_change(res){
  //TODO update this for new design
  return;
	var userGreeting = document.getElementById('gigya-user-greeting');
	var statusButton = document.getElementById('gigya-status-update');
	var logoutButton = document.getElementById('gigya-logout-button');
	var newsFeedButton = document.getElementById('gigya-newsfeed-button');
	var shareButton = document.getElementById('gigya-share-button');
	var actionButton = document.getElementById('gigya-action-button');
	var userLoggedIn = (res.user != null && res.user.isConnected);
	Drupal.settings.custom_gigya.userLoggedIn = userLoggedIn;
	if(userLoggedIn){
		userGreeting.innerHTML = 'Hello, ' + res.user.firstName;
		//Check to make sure the user can do status updates
		if(res.user.capabilities.status){
			statusButton.style.display = 'inline';
		}
		//Only do status updates on node pages
		if(Drupal.settings.custom_gigya.node_type){
			shareButton.style.display = 'inline';
		}
		newsFeedButton.style.display = 'inline';
		logoutButton.style.display = 'inline';
		actionButton.style.display = 'inline';
	}else{
		userGreeting.innerHTML = 'Log in to your favorite social network(s) ->';
		shareButton.style.display = 'none';
		statusButton.style.display = 'none';
		logoutButton.style.display = 'none';
		newsFeedButton.style.display = 'none';
		actionButton.style.display = 'none';
	}
  if(typeof(Drupal.settings.custom_gigya.node_type) != 'undefined'){
    var node_type = Drupal.settings.custom_gigya.node_type;
    if(node_type && node_type == 'article' || node_type == 'blog'){
      gigya_comments_show();
    }
  }
  //TODO: re-enable on correct pages when requested
	//gigya_chat_show();
	//gigya_activity_feed_show();
	//gigya_login_show(false);
}

//Chat stuff
function gigya_chat_show(stream, category, container, width, height){
  if(typeof(stream) == 'undefined'){
    if(typeof(Drupal.settings.custom_gigya.node_nid == 'undefined')){
      //Gigya's default
      stream = 0;
    }else{
      stream = Drupal.settings.custom_gigya.node_nid;
    }
  }
  if(typeof(category) == 'undefined'){
    category = 27813073;
  }
  if(typeof(container) == 'undeinfed'){
    container = 'gigya-chat';
  }
  if(typeof(width) == 'undefined'){
    width = 300;
  }
  if(typeof(height) == 'undefined'){
    height = 450;
  }
  var chat_div = document.getElementById(container);
  if(!chat_div){
    var chat_div = document.createElement('div');
    chat_div.setAttribute('id', container);
    //Add the chat div to the end of content-inner
    var content_inner = document.getElementById('content-inner');
    content_inner.insertBefore(chat_div, null);
  }
  var params = {
    categoryID: category,
    width: width,
    height: height,
    containerID: container,
    streamID: stream,
    cid: '',
    connectWithoutLoginBehavior: 'alwaysLogin'
  };
  gigya.services.socialize.showChatUI(custom_gigya.conf, params);
}


function generate_gigya_share_buttons(buttonList, comments_category){
  if(typeof(comments_category) == 'undefined'){
    comments_category = '';
  }
  var shareButtons = [];
  for(var i = 0; i < buttonList.length; i++){
    switch(buttonList[i]){
      case 'comments':
        shareButtons.push({
          provider: 'comments',
          categoryID: comments_category,
          streamID: Drupal.settings.custom_gigya.node_nid
        });
        break;
      case 'email':
        shareButtons.push({
          provider:'email',
          tooltip:'Email this',
          noButtonBorders: 'true'
        });
        break;
      case 'facebook':
        shareButtons.push({
          provider:'facebook-like',
          tooltip:'Recommend on Facebook',
          action:'recommend'
        });
        break;
      case 'googleplus':
        shareButtons.push({
          provider: 'google-plusone'
        });
        break;
      case 'twitter':
        shareButtons.push({
          provider:'twitter-tweet',
          tooltip:'Share on Twitter',
          via:'InsidePost',
          defaultText: Drupal.settings.custom_gigya.node_title,
          countURL: window.location.toString(), 
          related:'InsidePost,Derby,Grening'
        });
        break;
    }
  }
  return shareButtons;
}

//The callback for when we get the teaser from php
function gigya_share_page(teaser){

  var node_type = Drupal.settings.custom_gigya.node_type;
	var act = new gigya.services.socialize.UserAction();

	act.setTitle(Drupal.settings.custom_gigya.node_title);
	act.setDescription(teaser);
	act.setLinkBack(window.location.toString());
	act.addActionLink(Drupal.settings.custom_gigya.node_title, window.location.toString());
  //Provide a preview image for social sites other than facebook, twitter, and google+
  //  (those three use opengraph)
  sharePreviewImage = 'http://' + window.location.hostname + "/sites/all/themes/custom/images/ShareLogo.jpg";
  var shareImage = {
    type: 'image',
    src: sharePreviewImage,
    href: window.location.toString()
  };
  act.addMediaItem(shareImage);
  var category = 'Articles';
  if(node_type == 'blog'){
    //Set the blog author's name as the categoryID
    category = Drupal.settings.custom_gigya.blog_author;
  }

  var onShareClicked = function(evt){
    if(evt.shareItem.provider == 'comments'){
      window.scrollTo(0, $('#gigya-comments').offset()['top']);
    }
  };

	var params = {
    onShareButtonClicked: onShareClicked,
    userAction:act,
        containerID: 'social-links-container' 
	};
  //Generate the share buttons for each type
  switch(node_type){
    case 'article':
      params.shareButtons = generate_gigya_share_buttons(['facebook', 'twitter', 'googleplus', 'comments', 'email']);
      break;
    case 'blog':
      params.shareButtons = generate_gigya_share_buttons(['facebook', 'twitter', 'googleplus', 'comments', 'email']);
      break;
    case 'inside_post':
      params.shareButtons = generate_gigya_share_buttons(['facebook', 'twitter', 'googleplus', 'comments', 'email']);
      break;
    case 'special_event':
      params.shareButtons = generate_gigya_share_buttons(['facebook', 'twitter', 'googleplus']);
      break;
    case 'slideshow':
      params.shareButtons = generate_gigya_share_buttons(['facebook', 'twitter', 'email']);
      break;
    case 'page':
      params.shareButtons = generate_gigya_share_buttons(['facebook', 'twitter', 'googleplus', 'email']);
      break;
    default:
      //This type shouldn't have a share bar
      return;
  }
  gigya.services.socialize.showShareBarUI(custom_gigya.conf, params);
}

function gigya_share_error(response){
  //Share button error callback
}
function gigya_share_done(response){
	//Share button success callback
}

function gigya_comments_show(){
	if(typeof(Drupal.settings.custom_gigya.node_nid) != 'undefined'){
		var comments_div = document.getElementById('gigya-comments');
		if(!comments_div){
			var comments_div = document.createElement('div');
			comments_div.setAttribute('id', 'gigya-comments');
			var content_div = document.getElementById('content');
			//Add this to the end of the content div
			content_div.insertBefore(comments_div, null);
		}

    var templates = {
      loginCanvas_loggedOut: '<div id="gigya-comments-photo">$photoDiv</div><div id="gigya-comments-login">$loginDropdown<br />You must be logged in to post a comment.</div>'
    };
		var params = {
			categoryID: 'Articles',
			streamID: Drupal.settings.custom_gigya.node_nid,
			containerID: 'gigya-comments',
			cid: '',
			onError: gigya_comments_on_error,
      templates: templates
		}
    if(Drupal.settings.custom_gigya.node_type == 'blog'){
      //Set the blog author's name as the categoryID
      params['categoryID'] = Drupal.settings.custom_gigya.blog_author;
    }
    //set the stream info
    var streamInfoParams = {
      categoryID: params['categoryID'],
      streamTitle: document.title,
      streamURL: window.location,
      streamID: params['streamID']
    };
    gigya.services.comments.setStreamInfo(custom_gigya.conf, streamInfoParams);
    //show the comments ui
		gigya.services.socialize.showCommentsUI(custom_gigya.conf, params);
	}
}

function gigya_comments_on_error(eventObj){
	//comments error
  $.post(Drupal.settings.basePath + 'watchdog', {
    'error_type' : 'custom_gigya',
    'error_message' : "Comments error: " + eventObj.errorCode + " - " + eventObj.errorMessage + "\n" + eventObj.errorDetails});
}

function gigya_comment_count_callback(response){

	var container = response.context.container;
	var url = response.context.path;
	var numLinks = response.streamInfo.commentCount;
	
	if(numLinks > 0){
	  var text =  'Comments ('+numLinks+')';
	}else {
	  var text = 'Be the first to comment';
	}

	document.getElementById(container).innerHTML = '<a href="/'+url+'#comments" class="sprite sprite-comment_icon">'+ text+'</a>';
} 


//To enable, add "onCommentSubmitted: gigya_comments_on_submit," to the gigya_show_comments params array
//Example code to get the user's name from their login
/*function gigya_comments_on_submit(eventObj){
	var who = '';
	if(eventObj.user){
		who = eventObj.user.firstName;
	}else{
		who = eventObj.guestUser.username;
	}
}*/

//--------------The following code was in the original spec, but is not currently in use-----------

//Login stuff
function gigya_login_show(fromLink){
	inContainer = Drupal.settings.custom_gigya.gigyaLoginBoxMode;
	//From link is true when the login ui request is coming from a link
	fromLink = typeof(fromLink) == 'undefined' ? false : fromLink;
	userLoggedIn = Drupal.settings.custom_gigya.userLoggedIn;
	var params = {
		showTermsLink: false,
		hideGigyaLink: true,
		buttonsStyle: 'standard',
		showWhatsThis: true,
		cid: ''
		}
	if(inContainer){
		params.width = 200;
		params.height = 25;
		params.containerID = 'gigya-login-box';
	}
	if(fromLink || inContainer){
		if(userLoggedIn){
			gigya.services.socialize.showAddConnectionsUI(custom_gigya.conf, params);
		}else{
			gigya.services.socialize.showLoginUI(custom_gigya.conf, params);
		}
	}
	
}
function gigya_logout(){
	gigya.services.socialize.logout(custom_gigya.conf, {});
}

function gigya_on_login(eventObj){
	gigya_verify_signature(eventObj.UID, eventObj.timestamp, eventObj.signature);

	//Check if this is a new user for this site
	//	by searching through the db for eventObj.UID
	var new_user = true;

	if(new_user){
		//1. register the user
		//2. store the new user in the db
		//3. link the site account to social network
		//	3.1 - construct the account params to send to gigya
		var params = {
		};
		//	3.2 - call linkAccounts
	}
	gigya_refresh_user_info();
}

function gigya_on_logout(eventObj){
	gigya_refresh_user_info();
}


//Activity Feed
function gigya_activity_feed_show(){
	var activity_feed_parent = document.getElementById('sidebar-right');
	var front_page = false;
	if(!activity_feed_parent){
		//Check if we're on the frontpage
		activity_feed_parent = document.getElementById('frontpage-middle-right');
		front_page = true;
	}
	if(activity_feed_parent){
		var params={
			containerID: 'gigya-activity-feed',
			width: 300,
			height: 400,
			siteName: 'fake.com',
			onError: gigya_activity_feed_on_error
		};
		var activity_div = document.getElementById('gigya-activity-feed');
		if(!activity_div){
			activity_div = document.createElement('div');
			activity_div.setAttribute('id', 'gigya-activity-feed');
			if(front_page){
				activity_feed_parent.insertBefore(activity_div, activity_feed_parent.firstChild);
			}else{
				activity_feed_parent.insertBefore(activity_div, null);
			}
		}
		gigya.services.socialize.showFeedUI(custom_gigya.conf, params);
	}
}
function gigya_activity_feed_on_error(res){
	//Deal with activity feed errors
}

//Newsfeed stuff
function gigya_publish_newsfeed_link(message, link_title, link_url, callback){
	if(typeof(callback) == 'undefined'){
		callback = null;
	}
	var act = new gigya.services.socialize.UserAction();
	act.setUserMessage(message);
	act.addActionLink(link_title, link_url);
	var params = {
		userAction: act,
		scope: 'both'
	}
	if(callback){
		params['callback'] = callback;
	}

	gigya.services.socialize.publishUserAction(custom_gigya.conf, params);
}

function gigya_newsfeed_callback(response){
	switch(response.errorCode){
		case 0:
			//News feed updated
			break;
		default:
			//Error on news feed update
			break;
	}
}

//Actions
function gigya_submit_action(action_name){
	if(!action_name){
		return;
	}
	var context = {
		action_name: action_name
	};
	var params = {
		action : action_name,
		context: context,
		callback: gigya_submit_action_callback
	};

	gigya.services.gm.notifyAction(custom_gigya.conf, params);
}

function gigya_submit_action_callback(response){
	if(response.errorCode == 0){
	}else{
	}
}

