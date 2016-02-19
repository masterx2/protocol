/**
 * Created by masterx2 on 19.02.16.
 */
define(['lodash', 'signals', 'jquery'], function(_, signals, $) {

    function Protocol (transport) {
        this.transport = transport;
        this.linkTransport(transport.signals);

        this.eventMap = {};
        this.eventFlow = new signals.Signal()
    }

    Protocol.flags = {

        // Общие
        PING: 0,

        // Запросы
        CLIENT_CODE_VISITOR_REGISTER : 1,

        // Ответы
        SERVER_CODE_REGISTRATION_DONE: 101
    };

    Protocol.prototype = {
        _send: function(packet) {
            if (!this.transport) {
                this.eventFlow.dispatch('error', {message: 'Отсутствует транспорт'});
                return;
            }

            if (!this.transport.connected) {
                this.eventFlow.dispatch('error', {message: 'Отсутствует подключение'});
                return;
            }

            var token = this.transport.send(packet);

            if (!token) {
                this.eventFlow.dispatch('error', {message: 'Не удалось отправить данные'});
                return false;
            }

            var deferred = $.Deferred();
            this.eventMap[token] = deferred;

            (function(protocol){
                setTimeout(function () {
                    if (deferred.state() == "pending") {
                        protocol.eventFlow.dispatch('error', {message: 'Истекло время ожидания ответа'});
                        deferred.reject();
                    }
                }, 5000);
            })(this);

            return deferred.promise();
        },

        linkTransport: function(signals) {
            (function(protocol){
                signals.onopen.add(function() {
                    protocol.eventFlow.dispatch('connected', {
                        message: 'Подключено к '+ protocol.transport.config.host
                    });
                });

                signals.onerror.add(function() {
                    protocol.eventFlow.dispatch('error', {
                        message: 'Ошибка подключения'
                    });
                });

                signals.onclose.add(function() {
                    protocol.eventFlow.dispatch('error', {
                        message: 'Соединение закрылось'
                    });
                });

                // Сообщения отправляем в обработчик протокола
                signals.onmessage.add(function(event) {
                    protocol.dispatch(event.data);
                });
            })(this);
        },

        dispatch: function(rawMessage) {
            packet = JSON.parse(rawMessage);
            if (!packet.flag) {
                this.eventFlow.dispatch('error', {message: 'Нету флага('});
                return;
            }

            // Fire Common Data Events
            this.eventFlow.dispatch('incoming', packet);

            if (packet.token) {
                this.eventMap[packet.token].resolve(packet);
            }
        },

        ping: function() {
            return {flag: 0};
        },

        register: function(site_id, userData, extraData) {
            var payload = _.defaults(userData || {}, {
                location: 'Unknow location',
                title: 'Unknow Title',
                agent: 'Unknow UserAgent'
            });

            return this._send({
                flag: Protocol.flags.CLIENT_CODE_VISITOR_REGISTER,
                site_id: site_id,
                location: payload.location,
                title: payload.title,
                agent: payload.userAgent,
                extra_data: extraData || {}
            })
        }
    };

    return Protocol;
});