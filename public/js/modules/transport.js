/**
 * Created by masterx2 on 15.02.16.
 */
define(['jquery', 'lodash', 'signals'], function($,_,signals) {

    var Transport = function(config) {
        // Defaults
        this.config = {
            host: 'wss://s1.onicon.ru',
            reconnect_delay: 1e3,
            max_attempts: 5,
            reconnect_onclose: false
        };

        this.reconfig(config);
        this.connection_errors = 0;
        this.connected = false;
        this.tokenCounter = 1;


        // Пачка сигналов
        this.signals = {
            onopen: new signals.Signal(),
            onerror: new signals.Signal(),
            onclose: new signals.Signal(),
            onmessage: new signals.Signal(),
            send: new signals.Signal()
        };
    };

    Transport.prototype = {
        isSupported: "WebSocket" in window,

        reconfig: function(config) {
            this.config = _.defaults(config || {}, this.config);
        },

        send: function(packet) {
            if (this.ws && this.ws.readyState == 1) {
                var resultPacket = JSON.stringify(_.defaults(packet || {}, {
                    token: this.tokenCounter++
                }));
                this.ws.send(resultPacket);
                return this.tokenCounter - 1;
            }
        },

        connect: function() {
            // if (!this.isSupported) return;
            this.ws = new WebSocket(this.config.host, 'sample');
            (function(transport){
                transport.ws.onopen = function(event) {
                    // Есть коннект, отправляем транспорт
                    transport.connected = true;
                    transport.connection_errors = 0;
                    transport.signals.onopen.dispatch(event);
                };

                transport.ws.onclose = function(event) {
                    transport.connected = false;
                    if (transport.config.reconnect_onclose) {
                        transport.connect();
                    } else {
                        transport.signals.onclose.dispatch(event);
                    }
                };

                transport.ws.onmessage = function(event) {
                    transport.signals.onmessage.dispatch(event);
                };

                transport.ws.onerror = function(event) {
                    transport.connection_errors++;
                    // Пробуем повторить коннект
                    if (transport.connection_errors >= transport.config.max_attempts) {
                        // Хватит! Завершаем работу.
                        transport.connected = false;
                        transport.signals.onerror.dispatch(event);
                    } else {
                        // Ещё разок
                        setTimeout(function(){
                            transport.connect();
                        }, transport.config.reconnect_delay);
                    }
                };
            })(this);
        }
    };

    return Transport;
});