load('base');
load('lib/jsdeferred');

var EXPORTED_SYMBOLS = ['FoxSplitterGroup'];
 
function FoxSplitterGroup() 
{
	this.init();
}
FoxSplitterGroup.prototype = {
	__proto__ : FoxSplitterBase.prototype,

	isGroup : true,

	get screenX()
	{
		var member = this.leftMember || this.topMember;
		return member ? member.screenX : 0 ;
	},
	get screenY()
	{
		var member = this.topMember || this.leftMember;
		return member ? member.screenY : 0 ;
	},
	get width()
	{
		var member = this.rightMember || this.bottomMember;
		return member ? member.screenX - this.screenX + member.width : 0 ;
	},
	get height()
	{
		var member = this.bottomMember || this.rightMember;
		return member ? member.screenY - this.screenY + member.height : 0 ;
	},


	get topMember()
	{
		return this._getMemberAt(this.kPOSITION_TOP);
	},
	get rightMember()
	{
		return this._getMemberAt(this.kPOSITION_RIGHT);
	},
	get bottomMember()
	{
		return this._getMemberAt(this.kPOSITION_BOTTOM);
	},
	get leftMember()
	{
		return this._getMemberAt(this.kPOSITION_LEFT);
	},
	_getMemberAt : function FSG_getMemberAt(aPosition)
	{
		var members = this.members.filter(function(aMember) {
				return aMember.position == aPosition;
			});
		return members.length ? members[0] : null ;
	},

	get allWindows()
	{
		var members = this.members;
		members.forEach(function(aMember) {
			if (aMember.isGroup)
				members = members.concat(aMember.allWindows);
		});
		return members.filter(function(aMember) {
			return !aMember.isGroup;
		});
	},


	init : function FSG_init() 
	{
		this.id = Date.now() + '-' + parseInt(Math.random() * 65000);
		this.parent = null;

		this.members = [];
	},
 
	destroy : function FSG_destroy() 
	{
		this.members.forEach(function(aMember) {
			this.unregister(aMember);
		}, this);

		if (this.parent)
			this.parent.unregister(this);
	},



	moveTo : function FSG_moveTo(aX, aY, aSource)
	{
		this.moveBy(aX - this.screenX, aY - this.screenY, aSource);
	},

	moveBy : function FSG_moveBy(aDX, aDY, aSource)
	{
		this.members.forEach(function(aMember) {
			if (aMember != aSource)
				aMember.moveBy(aDX, aDY, aSource);
		});
	},

	resizeTo : function FSG_resizeTo(aW, aH)
	{
		this.resizeBy(aW - this.width, aH - this.height);
	},

	resizeBy : function FSG_resizeBy(aDW, aDH)
	{
		if (aDW) {
			let right = this.rightMember;
			if (right) {
				// expand both members!
				let halfDW = Math.round(aDW / 2);
				this.leftMember.resizeBy(halfDW, 0);
				right.moveBy(halfDW, 0);
				right.resizeBy(aDW - halfDW, 0);
			}
			else {
				this.members.forEach(function(aMember) {
					aMember.resizeBy(aDW, 0);
				});
			}
		}
		if (aDH) {
			let bottom = this.bottomMember;
			if (bottom) {
				// expand both members!
				let halfDH = Math.round(aDH / 2);
				this.topMember.resizeBy(0, halfDH);
				bottom.moveBy(0, halfDH);
				bottom.resizeBy(0, aDH - halfDH);
			}
			else {
				this.members.forEach(function(aMember) {
					aMember.resizeBy(0, aDH);
				});
			}
		}
	},

	raise : function FSG_raise()
	{
		this.members.forEach(function(aMember) {
			aMember.raise();
		});
	},


	// group specific features

	register : function FSG_register(aFSWindow)
	{
		if (this.members.indexOf(aFSWindow) < 0) {
			this.members.push(aFSWindow);
			aFSWindow.parent = this;
		}
	},

	unregister : function FSG_unregister(aFSWindow)
	{
		var index = this.members.indexOf(aFSWindow);
		if (index > -1) {
			this.members.splice(index, 1);
			if (aFSWindow.parent == this)
				aFSWindow.parent = null;
		}
		if (this.members.length == 1) {
			let lastMember = this.members[0];
			if (this.parent) {
				// swap existing relations
				lastMember.position = this.position;
				this.parent.register(lastMember);
				this.unregister(lastMember);
			}
			if (this.maximized || this.fullscreen) {
				let x = this.normalX;
				let y = this.normalY;
				let width = this.normalWidth;
				let height = this.normalHeight;
				let maximized = this.maximized;
				Deferred
					.next(function() {
						lastMember.moveTo(x, y);
						lastMember.resizeTo(width, height);
					})
					.next(function() {
						if (maximized)
							lastMember.window.maximize();
					});
			}
			this.destroy();
		}
	},


	readyToMaximize : function FSG_readyToMaximize()
	{
		if (this.maximized)
			return;

		this.normalX = this.screenX;
		this.normalY = this.screenY;
		this.normalWidth = this.width;
		this.normalHeight = this.height;
	},

	maximizeTo : function FSG_maximizeTo(aX, aY, aWidth, aHeight)
	{
		this.moveTo(aX, aY);
		this.resizeTo(aWidth, aHeight);

		this.maximized = true;
	},

	restore : function FSG_restore()
	{
		if (!this.maximized || !('normalX' in this))
			return;

		this.moveTo(this.normalX, this.normalY);
		this.resizeTo(this.normalWidth, this.normalHeight);
		delete this.normalX;
		delete this.normalY;
		delete this.normalWidth;
		delete this.normalHeight;

		this.maximized = false;
	}
};
  
