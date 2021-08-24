let instance = null;

export default class WSController{  
    constructor() {
        if(!instance){//null
            instance = this;
            this.ws = new WebSocket("wss://sd.randgor.ru/socket:443")
        }
        
        return instance;
    }

    nullify() {
        instance = null;
    }
}