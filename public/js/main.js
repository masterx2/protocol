/**
 * Created by masterx2 on 04.02.16.
 */
requirejs.config({
    baseUrl: 'js',
    paths: {
        jquery: 'vendor/jquery.min',
        signals: 'vendor/signals.min',
        lodash: 'vendor/lodash.min',
        handlebars: 'vendor/handlebars.amd.min',
        cookie: 'vendor/cookie.min',
        transport: 'modules/transport',
        protocol: 'modules/protocol'
    },
    shim: {
        'lodash': {
            exports: '_'
        }
    },
    map: {
        '*': { 'jquery': 'jquery-private' },
        'jquery-private': { 'jquery': 'jquery' }
    }
});

requirejs(['transport', 'protocol', 'cookie'], function(Transport, Protocol, cookie) {

    var userData = {
        site_id: '56c7886d28668857678b45c5'
    };

    function Chat () {
        this.protocol = new Protocol(new Transport({
            host: 'wss://s6.onicon.ru',
            max_attempts: 5
        }));
    }

    Chat.prototype = {
        init: function() {
            this.user_id = cookie('uid');
            this.user_hash = cookie('uhash');

            // Вешаемся на поток событий протокола
            (function(chat){
                chat.protocol.eventFlow.add(function(type, params) {
                    switch (type) {
                        case 'connected':
                            chat.connected(params);
                            break;
                    }
                });
            })(this);


            // Коммандуем транспорту соединится
            this.protocol.transport.connect();
        },

        connected: function (params) {
            if (this.user_id && this.user_hash) {

            } else {
                this.protocol.register(userData.site_id).then(function(data){
                    cookie.set({
                        uid: data.user_id,
                        uhash: data.user_hash
                    }, {
                        expires: 10
                    });
                });
            }
        }
    };

    chat = new Chat();
    chat.init();
});