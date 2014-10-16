var StoreApp = {
	Collection : {},
	Model : {},
	View : {},
	Router: {}
};


StoreApp.View.DetailView = Backbone.View.extend({
	// Get the markup from this id for the views template
	el: '#detail',
	template : $('#tmp-details').html(),

	initialize: function() { },

	// Event list
	events: {
		'click button#back':'back',
		'click button#cart':'addToCart'
	},

	// Render the view with the template
	render: function () {
		this.$el.html( _.template( this.template, this.model.toJSON() ) );
		return this;
	},

	setModel: function (model) {
		this.model = model;
		this.render();
	},

	// Called on view click
	addToCart : function() {
		// Add the model to the Cart view
		StoreApp.cart.add( this.model );
	},

	back: function(){
		window.router.navigate('#', true);
	}
});

// Our Model type
StoreApp.Model.Picture = Backbone.Model.extend({

	defaults : {
		'price' : 0,
		'image': '',
		'thumb': '',
		'total': 0,
		'quantity': 1
	},

	// Set and return the total for said model ( price x quantity )
	total : function() {

		var total = this.get('price') * this.get('quantity');
		this.set('total', total);
		return total;

	},

	// Increase or decrease the quantity
	quantity : function( type ) {
		var thisQuantity = this.get('quantity');
		this.set('quantity', (type === 'increase' ? ++thisQuantity : --thisQuantity) );
	}

});

// Define our Collection
StoreApp.Collection.Pictures = Backbone.Collection.extend({

	models: StoreApp.Model.Picture,

	// Returns the total amount for all items, using model.total()
	subtotal : function() {

		var total = 0;

		this.each(function( model ){
			total += model.total();
		});

		return total.toFixed(2);
	}
});

// View for individual item in the Item list
StoreApp.View.Picture = Backbone.View.extend({

	// this view is a li element
	tagName: 'li',
	className: 'col-md-4',

	// Get the markup from this id for the views template
	template : $('#tmp-pictureItem').html(),

	// Event list
	events: {
		'click button#moreInfo': 'navigate',
		'click button#addCart' : 'addToCart'
	},

	navigate : function(e){
		e.preventDefault();
		window.router.navigate('artist/' + this.model.id, true);
	},

	initialize: function() {
		// On init, render
		this.render();
	},

	render: function() {
		// Render the view with the template
		this.$el.html( _.template( this.template, this.model.toJSON() ) );
		return this;
	},

	// Called on view click
	addToCart : function() {
		// Add the model to the Cart view
		StoreApp.cart.add(new StoreApp.Model.Picture(appView.getCollectionItem(this.model.id -1)));
	}
});


// View for the List of individual items
StoreApp.View.PictureListView = Backbone.View.extend({

	el: '#default-item-list',

	initialize: function() {
        // wait to the "reset" trigger
		this.collection.on("reset", this.render, this);
	},

	render: function() {
		this.addAll();
	},
	addOne: function (thePicture) {
		var pictureView = new StoreApp.View.Picture({ model: thePicture });
		this.$el.append( pictureView.render().el );
	},
	addAll: function () {
		this.collection.forEach(this.addOne, this);
	}

});



// Individual View for Item inside Shopping Cart
StoreApp.View.ShoppingCartItemView = Backbone.View.extend({

	// This view is a tr element
	tagName: 'tr',
	template : $('#tmp-shoppingCartItem').html(),

	events : {
		'click .name' : 'remove',
		'click .quantity' : 'manageQuantity'
	},

	initialize : function() {

		this.render();

		// If this models contents change, we re-render
		this.model.on('change', function(){
			this.render();
		}, this);

	},

	render : function() {

		// Render this view and return its context
		this.$el.html( _.template( this.template, this.model.toJSON() ));
		return this;

	},

	manageQuantity : function( event ) {

		// Get quantity type from data-type in the element
		var type = $(event.target).data('type');

		// If this event is to decrease, and the current quantity is 1
		if( this.model.get('quantity') === 1 && type === 'decrease' ) {

			this.remove();

		} else {

			// enot fully implemented
			this.model.quantity(type);
		}
	},

	remove : function(){

		// Fade out item out from the shopping cart list
		this.$el.fadeOut(500, function(){

			// Remove it from the DOM on completetion
			$(this).remove();

		});

		// Remove the model for this view from the Shopping Cart Items collection
		StoreApp.cartItems.remove( this.model );
	}
	

});



// View for the Shopping Cart, container for individual Shopping Cart Item Views
StoreApp.View.ShoppingCart = Backbone.View.extend({

	el: '#shopping-list',

	// Some other elements to cache
	total : $('#total'),
	cartTotal : $('#basket'),

	initialize : function(){

		// make a reference to the collection this view dances with
		this.collection = StoreApp.cartItems;

		// execute default message for the shopping cart on init
		this.defaultMessage();

		// Listen for events ( add, remove or a change in quantity ) in the collection
		this.collection.on('add remove', function( item ){

			// Update the main total based on the new data
			this.updateTotal();

			// If there is no items in the Cart
			if( this.collection.length === 0 ) {
				this.defaultMessage();
			}

			// Pass in this views context
		}, this);

	},

	defaultMessage : function() {
		$('#showForm').hide();
		// Give the view a class of empty, and inject new default content
		this.$el.addClass('empty').html('<tr><td colspan="4"><i class="fa fa-shopping-cart"></i> Cart is empty</td></tr>');

	},

	add : function( item ) {

		// Remove .empty class from the view
		this.$el.removeClass('empty');
		$('#showForm').fadeIn();

		// Increase the quantity by 1
		item.quantity('increase');

		// Add the passed item model to the Cart collection
		this.collection.add( item );

		// Render the view
		this.render();

	},

	// Update the totals in the cart
	updateTotal : function() {

		// This is the var for the counter at the top of the page
		var cartTotal = 0;

		// Loop through this collection and addup the number of items
		this.collection.each(function( item ){
			cartTotal += item.get('quantity');
		});

		// Inject these totals
		this.cartTotal.html( cartTotal );
		this.total.html( this.collection.subtotal() );

	},

	render : function(){

		// Empty the view
		this.$el.html('');

		// Loop through the collection
		this.collection.each(function( item ){

			// Render each item model into this List view
			var newItem = new StoreApp.View.ShoppingCartItemView({ model : item });
			this.$el.append( newItem.render().el );

			// Pass this list views context
		}, this);

	}

});


// Default Items for our item List.
var items = [
	{ id:'1',title: 'Lake', thumb:'img/thumb/1.jpg',image:'img/1.jpg',price: 2.99, photographer:'Bob',tag:'myTag',description:'Et mea prima verterem. Has eu eligendi facilisi. Cu graece populo eos, cum suas contentiones ne, nam sanctus dolorem efficiendi id. Ei invidunt dignissim temporibus has, ea usu iudicabit erroribus mediocritatem, nec sanctus eligendi delicata ex. An detraxit incorrupte vituperatoribus nec, ad vim vide altera suscipiantur. Cu has vitae expetenda, est congue instructior no, qui scripta utroque voluptaria no. Te senserit deterruisset mea, mel primis electram splendide ea. Ipsum percipitur philosophia usu ad. Has quod fierent contentiones ei, eos id dicat iracundia, vis falli soleat dicunt cu. Nam et congue oblique.' },
	{ id:'2',title: 'Travel', thumb:'img/thumb/2.jpg',image:'img/2.jpg',price: 3.99, photographer:'Paolo',tag:'myTag',description:'Vidit audire in sed, id mei cetero impedit neglegentur, eripuit fierent patrioque ut usu. Saepe semper ut qui, cu saepe scaevola ius? In quo prima vidisse elaboraret. Est id latine facilis sententiae, sensibus definitionem no sit. An vidisse scribentur has, ei vel qualisque aliquando? Vero vide vidit in eos.' },
	{ id:'3',title: 'Mountains', thumb:'img/thumb/3.jpg',image:'img/3.jpg', price: 1.40, photographer:'Michele',tag:'myTag',description:'Causae complectitur in sed, petentium reprehendunt sit ut! Falli delicata mel ex, amet lorem eum cu. Sit at forensibus concludaturque. Usu iusto tractatos et? Eligendi delectus no mei. Ea habeo facilis qui, lorem mollis scripta ut duo. Noster ponderum vituperata ea usu. Vero vide vidit in eos, ei mentitum periculis his? Quo mazim decore philosophia ea, ad mei harum albucius, malorum comprehensam conclusionemque cu duo. Dicam everti has in, sea ea alia probo dicat!' },
	{ id:'4',title: 'Paris', thumb:'img/thumb/4.jpg',image:'img/4.jpg', price: 5.88, photographer:'Ettore',tag:'myTag',description:'Cu pri nonumy latine? Ei probatus deserunt est. Tacimates prodesset gloriatur mei at. Quidam scribentur ex per. Eum accumsan maiestatis accommodare cu, usu alterum delenit et. Platonem philosophia vix te, sed cu alterum vivendum nominati. Justo commune argumentum an nam, at sonet tantas graecis mea. Vim eu omittam interesset definitiones! Ut quo mucius dissentiunt accommodare. Cu postea equidem habemus sit, sea ad erat movet, ancillae copiosae an est?' },
	{ id:'5',title: 'Passion', thumb:'img/thumb/5.jpg',image:'img/5.jpg', price : 1.99, photographer:'paolo',tag:'myTag',description:'Vidit audire in sed, id mei cetero impedit neglegentur, eripuit fierent patrioque ut usu. Saepe semper ut qui, cu saepe scaevola ius? In quo prima vidisse elaboraret. Est id latine facilis sententiae, sensibus definitionem no sit. An vidisse scribentur has, ei vel qualisque aliquando? Vero vide vidit in eos.' },
	{ id:'6',title: 'Map', thumb:'img/thumb/6.jpg',image:'img/6.jpg', price : 1.99, photographer:'Bob',tag:'myTag',description:'Vidit audire in sed, id mei cetero impedit neglegentur, eripuit fierent patrioque ut usu. Saepe semper ut qui, cu saepe scaevola ius? In quo prima vidisse elaboraret. Est id latine facilis sententiae, sensibus definitionem no sit. An vidisse scribentur has, ei vel qualisque aliquando? Vero vide vidit in eos.' },
	{ id:'7',title: 'Cappuccino', thumb:'img/thumb/7.jpg',image:'img/7.jpg',price: 2.99, photographer:'Gino',tag:'myTag',description:'Et mea prima verterem. Has eu eligendi facilisi. Cu graece populo eos, cum suas contentiones ne, nam sanctus dolorem efficiendi id. Ei invidunt dignissim temporibus has, ea usu iudicabit erroribus mediocritatem, nec sanctus eligendi delicata ex. An detraxit incorrupte vituperatoribus nec, ad vim vide altera suscipiantur. Cu has vitae expetenda, est congue instructior no, qui scripta utroque voluptaria no. Te senserit deterruisset mea, mel primis electram splendide ea. Ipsum percipitur philosophia usu ad. Has quod fierent contentiones ei, eos id dicat iracundia, vis falli soleat dicunt cu. Nam et congue oblique.' },
	{ id:'8',title: 'Pier', thumb:'img/thumb/8.jpg',image:'img/8.jpg',price: 3.99, photographer:'Michele',tag:'myTag',description:'Vidit audire in sed, id mei cetero impedit neglegentur, eripuit fierent patrioque ut usu. Saepe semper ut qui, cu saepe scaevola ius? In quo prima vidisse elaboraret. Est id latine facilis sententiae, sensibus definitionem no sit. An vidisse scribentur has, ei vel qualisque aliquando? Vero vide vidit in eos.' },
	{ id:'9',title: 'Fog', thumb:'img/thumb/9.jpg',image:'img/9.jpg', price: 1.40, photographer:'Bob',tag:'myTag',description:'Causae complectitur in sed, petentium reprehendunt sit ut! Falli delicata mel ex, amet lorem eum cu. Sit at forensibus concludaturque. Usu iusto tractatos et? Eligendi delectus no mei. Ea habeo facilis qui, lorem mollis scripta ut duo. Noster ponderum vituperata ea usu. Vero vide vidit in eos, ei mentitum periculis his? Quo mazim decore philosophia ea, ad mei harum albucius, malorum comprehensam conclusionemque cu duo. Dicam everti has in, sea ea alia probo dicat!' },
	{ id:'10',title: 'Bear', thumb:'img/thumb/10.jpg',image:'img/10.jpg', price: 9.99, photographer:'Ettore',tag:'myTag',description:'Cu pri nonumy latine? Ei probatus deserunt est. Tacimates prodesset gloriatur mei at. Quidam scribentur ex per. Eum accumsan maiestatis accommodare cu, usu alterum delenit et. Platonem philosophia vix te, sed cu alterum vivendum nominati. Justo commune argumentum an nam, at sonet tantas graecis mea. Vim eu omittam interesset definitiones! Ut quo mucius dissentiunt accommodare. Cu postea equidem habemus sit, sea ad erat movet, ancillae copiosae an est?' },
	{ id:'11',title: 'Houses', thumb:'img/thumb/11.jpg',image:'img/11.jpg', price: 3.78, photographer:'Gino',tag:'myTag',description:'Has nullam commune sententiae ne, alii expetenda sit in. Ut nam etiam partiendo urbanitas, mazim errem sea at. Pro sonet facilisis adipiscing ei, omnis dicam in his, quo id possit saperet corrumpit. Mel an fabellas incorrupte interesset, vis et malis verterem mediocritatem. Ea mei causae malorum appellantur. Usu ei enim facer detraxit, vix te tacimates pertinax urbanitas.' },
	{ id:'12',title: 'Skyline', thumb:'img/thumb/12.jpg',image:'img/12.jpg', price : 1.99, photographer:'Paolo',tag:'myTag',description:'Vidit audire in sed, id mei cetero impedit neglegentur, eripuit fierent patrioque ut usu. Saepe semper ut qui, cu saepe scaevola ius? In quo prima vidisse elaboraret. Est id latine facilis sententiae, sensibus definitionem no sit. An vidisse scribentur has, ei vel qualisque aliquando? Vero vide vidit in eos.' },
	{ id:'13',title: 'X100S', thumb:'img/thumb/13.jpg',image:'img/13.jpg',price: 2.99, photographer:'Gino',tag:'myTag',description:'Et mea prima verterem. Has eu eligendi facilisi. Cu graece populo eos, cum suas contentiones ne, nam sanctus dolorem efficiendi id. Ei invidunt dignissim temporibus has, ea usu iudicabit erroribus mediocritatem, nec sanctus eligendi delicata ex. An detraxit incorrupte vituperatoribus nec, ad vim vide altera suscipiantur. Cu has vitae expetenda, est congue instructior no, qui scripta utroque voluptaria no. Te senserit deterruisset mea, mel primis electram splendide ea. Ipsum percipitur philosophia usu ad. Has quod fierent contentiones ei, eos id dicat iracundia, vis falli soleat dicunt cu. Nam et congue oblique.' },
	{ id:'14',title: 'Trains', thumb:'img/thumb/14.jpg',image:'img/14.jpg',price: 3.99, photographer:'paolo',tag:'myTag',description:'Vidit audire in sed, id mei cetero impedit neglegentur, eripuit fierent patrioque ut usu. Saepe semper ut qui, cu saepe scaevola ius? In quo prima vidisse elaboraret. Est id latine facilis sententiae, sensibus definitionem no sit. An vidisse scribentur has, ei vel qualisque aliquando? Vero vide vidit in eos.' },
	{ id:'15',title: 'Library', thumb:'img/thumb/15.jpg',image:'img/15.jpg', price: 1.40, photographer:'Michele',tag:'myTag',description:'Causae complectitur in sed, petentium reprehendunt sit ut! Falli delicata mel ex, amet lorem eum cu. Sit at forensibus concludaturque. Usu iusto tractatos et? Eligendi delectus no mei. Ea habeo facilis qui, lorem mollis scripta ut duo. Noster ponderum vituperata ea usu. Vero vide vidit in eos, ei mentitum periculis his? Quo mazim decore philosophia ea, ad mei harum albucius, malorum comprehensam conclusionemque cu duo. Dicam everti has in, sea ea alia probo dicat!' },
	{ id:'16',title: 'Rock\'nRoll', thumb:'img/thumb/16.jpg',image:'img/16.jpg', price: 0.78, photographer:'Ettore',tag:'myTag',description:'Cu pri nonumy latine? Ei probatus deserunt est. Tacimates prodesset gloriatur mei at. Quidam scribentur ex per. Eum accumsan maiestatis accommodare cu, usu alterum delenit et. Platonem philosophia vix te, sed cu alterum vivendum nominati. Justo commune argumentum an nam, at sonet tantas graecis mea. Vim eu omittam interesset definitiones! Ut quo mucius dissentiunt accommodare. Cu postea equidem habemus sit, sea ad erat movet, ancillae copiosae an est?' },
	{ id:'17',title: 'Palm\'s Beach', thumb:'img/thumb/17.jpg',image:'img/17.jpg', price: 7.90, photographer:'Gino',tag:'myTag',description:'Has nullam commune sententiae ne, alii expetenda sit in. Ut nam etiam partiendo urbanitas, mazim errem sea at. Pro sonet facilisis adipiscing ei, omnis dicam in his, quo id possit saperet corrumpit. Mel an fabellas incorrupte interesset, vis et malis verterem mediocritatem. Ea mei causae malorum appellantur. Usu ei enim facer detraxit, vix te tacimates pertinax urbanitas.' }

];


/* THIS IS THE MAIN APP VIEW, everithing start here */

StoreApp.View.AppView = Backbone.View.extend({
	initialize : function(){

		// define detail View, set to 1
		StoreApp.detailView = new StoreApp.View.DetailView();

		// define collections pictures && cartItems
		StoreApp.pictures = new StoreApp.Collection.Pictures();
		StoreApp.cartItems = new StoreApp.Collection.Pictures();

		// define our shopping cart
		StoreApp.cart = new StoreApp.View.ShoppingCart();

		StoreApp.pictures.add( new StoreApp.Model.Picture( StoreApp.pictures ) );

		// define the clickable objects
		StoreApp.pictureList = new StoreApp.View.PictureListView({ collection: StoreApp.pictures });

		this.fetchCollections();


		// Example of an external listener,
		// Execute when a model is added to the cart Items collection
		StoreApp.cartItems.on('add', function( item ){

			// Make sure this models quantity is set to 1 on adding
			item.set('quantity',1);

		});
	},
	// add all items in the json to the collection
	fetchCollections: function () {
		// here goes the ajax call, in this example it's a fake json
		StoreApp.pictures.reset(items);
	},
	// get one item in the json
	getCollectionItem: function(id){
		return items[id];
	}
});

StoreApp.Router = Backbone.Router.extend({
	routes: {
		"": "index",
		"#": "index",
		"artist/:id": "artist"
	},
	index: function(){
		// hide the detail view & show the list
		$('#default-item-list').show();
		$('#detail').hide();
	},

	artist: function (id) {
        // hide the list and show the detail view
		$('#default-item-list').hide();

		StoreApp.detailView.setModel(new StoreApp.Model.Picture(appView.getCollectionItem( id-1 )));
		$('#detail').show();
	}
});

$(function () {

	window.appView = new StoreApp.View.AppView({el:document});
	window.router = new StoreApp.Router;
	Backbone.history.start();


	// delegate calls to data-toggle="lightbox"
	$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
		event.preventDefault();
		return $(this).ekkoLightbox({
			always_show_close: true
		});
	});


	// check mail
	function checkMail(form){
		var controlNumber=0;
		if(form === 'sendMail'){
			if($('#name').val() === ''){
				$('#name').parent().find('.alert').show();
				controlNumber++;
			}
			if($('#email').val() === '' || validateEmail($('#email').val()) === false){
				$('#email').parent().find('.alert').show();
				controlNumber++;
			}
			if($('#message').val() === ''){
				$('#message').parent().find('.alert').show();
				controlNumber++;
			}
		}
		return controlNumber;
	}

	function validateEmail(email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	$('#sendMailButton').on('click',function(){
		if(checkMail($('form#sendMail').attr('id')) === 0){
			$('.modal-footer button').hide();
			$('.modal-body')
				.find('form').hide().end()
				.find('form input').html('').end()
				.find('#thanks').show();
		}
		return false;
	});
	
	
	// add link in a new tab/window
	addTargetBlank = function(){
		$("a[rel=external], a[href^='http:']:not([href*='" + window.location.host + "']), a[href^='https:']:not([href*='" + window.location.host + "'])").each(function(){
			$(this).attr("target", "_blank");
		});
	};
		
	addTargetBlank();
});
