window.Telekinesis = function () {

    var eventTypes = {
        mouse: {
            down: 'mousedown',
            move:  'mousemove',
            up:   'mouseend'
        },
        touch: {
            down: 'touchstart',
            move:  'touchmove',
            up:   'touchend'
        },
        pointer: {
            down: 'pointerdown',
            move:  'pointermove',
            up:   'pointerup'
        }
    }

    var fingers      = [],
        id           = 0,
        touchRE      = /^touch/

    function Finger (type) {
        this.identifier = id
        id += 1
        this.type = type in eventTypes ? type : getDefaultType()
        fingers.push(this)
        this.x = 0
        this.y = 0
    }

    Finger.prototype = {

        down: function (x, y) {
            // here the x and y === clientX and clientY
            this.active = true
            emit.call(this, 'down', x, y)
            return this
        },

        move: function (x, y) {
            emit.call(this, 'move', x, y)
            return this
        },

        up: function (x, y) {
            this.active = false
            emit.call(this, 'up', x, y)
            return this
        }

    }

    // private functions for Finger

    function emit (eventName, x, y) {
        // `this` is a finger instance
        this.x = x || this.x
        this.y = y || this.y
        eventName = eventTypes[this.type][eventName]
        var target = document.elementFromPoint(this.x, this.y)
        if (!target) {
            console.warn('"' + eventName + '" out of bound at x:' + this.x + ', y:' + this.y)
            return
        }
        var payload = createPayload.call(this, event, target)
        synthesizeEvent(eventName, payload, target)
    }

    function createPayload (event, target) {
        var left = document.documentElement.scrollLeft || document.body.scrollLeft,
            top = document.documentElement.scrollTop || document.body.scrollTop,
            point = {
                identifier: this.identifier,
                clientX: this.x,
                clientY: this.y,
                pageX: this.x + left,
                pageY: this.y + top,
                target: target
            },
            payload

        this.target = target
        this.point  = point

        if (this.type === 'touch') {
            payload = {
                touches: getAll(),
                changedTouches: [point],
                targetTouches: getAllByTarget(target)
            }
        } else {
            payload = point
        }
        return payload
    }

    function getDefaultType () {
        return ('ontouchstart' in window) ? 'touch' : 'mouse'
    }

    // finger list management

    function getAll () {
        var res = []
        fingers.forEach(function (f) {
            if (f.active) res.push(f.point)
        })
        return res
    }

    function getAllByTarget (target) {
        var res = []
        fingers.forEach(function (f) {
            if (f.active && f.target === target) res.push(f.point)
        })
        return res
    }

    // general custom event dispatcher

    function synthesizeEvent (eventName, payload, target) {
        var event = document.createEvent('CustomEvent')
        event.initEvent(eventName, true, true)
        for (var k in payload) {
            event[k] = payload[k]
        }
        target.dispatchEvent(event)
    }

    return {
        Finger: Finger
    }

}();