//Network.js  
var WebSocket = WebSocket || window.WebSocket || window.MozWebSocket;  
  
var WsNetwork  = (function(){  
    var instance = null;

    function getNetworkInstance (){  
        var networkInstance = {  
            socket:null, 
            host: null,
            isInit:false,
            seq_id: 0,
            to_svr_type: 0,
            to_svr_id: 0,
            callback: null, 
            initNetwork:function(url, callback){  
                console.log('Network initSocket...', url);  
                this.host = url || "ws://echo.websocket.org"
                this.callback = callback;
                this.reconnect();
            },
            reconnect: function() {
                if(this.isInit) {
                    return;
                }
                this.socket = new WebSocket(this.host);  
                var self = this;
                this.socket.onopen = function(evt){  
                    console.log("socket open")
                    self.isInit = true;
                    // console.eventManager.dispatchCustomEvent("WsNetworkOnOpen")
                    if(self.callback) {
                        self.callback("onopen")
                    }
                };  
                  
                this.socket.onmessage = function(evt){  
                    console.log("socket onmessage")
                    var data = evt.data;  
                    if(self.callback) {
                        self.callback("onmessage", evt)
                    }
                };  
                  
                this.socket.onerror = function(evt){  
                    console.log("socket onerror")
                    if(self.callback) {
                        self.callback("onerror", evt)
                    }
                    self.isInit = false;
                };  
                  
                this.socket.onclose = function(evt){
                    console.log("socket onclose")
                    // console.eventManager.dispatchCustomEvent("WsNetworkOnClose")
                    if(self.callback) {
                        self.callback("onclose")
                    }
                    self.isInit = false;  
                };

                this.socket.onopen = function(evt){
                    console.log("socket onopen")
                    self._isActiveClose = false
                    self.isInit = true;
                    // console.eventManager.dispatchCustomEvent("WsNetworkOnOpen")
                    if(self.callback) {
                        self.callback("onopen")
                    }

                    function setHeartTimer() {
                        if(!self.isInit || self.heartTime) {
                            return;
                        }
                        self.heartTime = setTimeout(function () {
                            self.heartTime = null
                            self.sendMessage(CMD_CHECK_HEART, {})
                            setHeartTimer()
                        }, 60000)
                    }

                    setHeartTimer()

                    self.sendMessage("cmd_internal_auth", "aaa", "bb")

                    self.sendMessage("cmd_login", {"user": 222})
                };
            },
            isConnect: function() {
                return this.isInit;
            },
            send:function(data){  
                if (!this.isInit){
                    //this.reconnect();
                    console.log('Network is not inited...');  
                }else if(this.socket && this.socket.readyState == WebSocket.OPEN){
                    this.socket.send(data);  
                }else{
                    this.socket && console.log('Network WebSocket readState:'+this.socket.readyState);
                }  
            },  
            close:function(){  
                if (this.socket){
                    this.isHandlerClose=true
                    console.log("Network close...");  
                    this.socket.close();  
                    this.socket = null;  
                }  
            },
            sendMessage: function() {
                // var sendData = [];
                // for(var i = 0; i < arguments.length; i++) {
                //     sendData.push(arguments[i]);
                // }
                // var data = JSON.stringify(sendData);
                // this.send(data);
                // 
                
                var name = arguments[0]
                var sendData = [];
                for(var i = 1; i < arguments.length; i++) {
                    sendData.push(arguments[i]);
                }

                console.log("sendData = ", sendData)

                var buffer = new ByteBuffer(64, true);
                var success = encode_proto(buffer, name, sendData)
                if(!success) {
                    console.log("encode ", name, " failed!!!!")
                    return
                }

                var final_buffer = new ByteBuffer()
                final_buffer.writeUint32(24 + buffer.offset)
                final_buffer.writeUint16(this.seq_id++)
                final_buffer.writeUint32(0)
                final_buffer.writeUint8(0)
                final_buffer.writeUint8(0)
                final_buffer.writeUint16(0)
                final_buffer.writeUint32(0)
                final_buffer.writeUint16(this.to_svr_type)
                final_buffer.writeUint32(this.to_svr_id)

                var array = new ArrayBuffer(24 + buffer.offset);
                new Uint8Array(array).set(new Uint8Array(final_buffer.buffer).subarray(0, final_buffer.offset), 0);
                new Uint8Array(array).set(new Uint8Array(buffer.buffer).subarray(0, buffer.offset), 24);
                
                this.send(array);
            },
        };  
        return networkInstance;  
    };  
  
  
    return {  
        getInstance:function(){  
            if(instance === null){  
                instance = getNetworkInstance();  
            }  
            return instance;  
        }  
    };  
})();