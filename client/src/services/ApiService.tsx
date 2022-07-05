import moment from "moment"


// import useToken from '../components/authentication/useToken'
const basePath = "http://localhost:4201"

const token = localStorage.getItem('access_token')

const options: RequestInit = {
 //   method: '', // *GET, POST, PUT, DELETE, etc.
 //   mode: 'cors', // no-cors, *cors, same-origin
 //   cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
 //   credentials: 'same-origin', // include, *same-origin, omit
    headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }),
   // redirect: 'follow', // manual, *follow, error
  //  referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
}

export default class ApiService {

    async login(loginData: any) {
        options.method = 'POST'
        options.body = JSON.stringify(loginData)
        const response = await fetch(basePath + '/login', options)
        return response.status === 200 ? response.json() : response
    }

    async logout() {
        options.method = 'POST'
        options.body = JSON.stringify({Data: localStorage.getItem('refresh_token')})
        const response = await fetch(basePath + '/logout', options)
        return response.status === 200 ? response.json() : response
    }

    async signIn(signInData: any) {
        options.method = 'POST'
        options.body = JSON.stringify(signInData)
        const response = await fetch(basePath + '/signin', options)
        return response.status === 200 ? response.json() : response
    }

    getUser(id: number) {
        options.method = 'GET'
        return fetch_retry(basePath + '/users/' + id, options, 2)
    }

    getUsers() {
        options.method = 'GET'
        return fetch_retry(basePath + '/users', options, 2)
    }

    createUser(data?: any) {
        options.method = 'POST'
        options.body = JSON.stringify(data)
        return fetch_retry(basePath + '/users', options, 2)
    }

    static IsLoggedIn(): boolean {
        const username = localStorage.getItem('full_name')
        return !username || username === "" ? false : true
    }

}

function fetch_retry(url:string, opt:any, n:number) {
    return new Promise(function(resolve, reject) {
        fetch(url, opt)
        .then( (response:any) => {
            if(response.status == 401) {
                if (n === 1) return reject("It was not possible to refresh token")
                if(!ApiService.IsLoggedIn()) return reject("This resource is protected. You have to login before")
                let opt = { 
                    method: 'POST',
                    headers: new Headers({'Content-Type': 'application/json'}),
                    body:  JSON.stringify({data: localStorage.getItem('refresh_token')})  
                }
                 
                fetch(basePath + '/refresh_token', opt)
                .then( async (response:any) => {
                    if (response.status !== 200) {
                        localStorage.clear()
                        reject("Error refreshing token")
                    }
                    const token = await response.json()
                    
                    localStorage.setItem('access_token', token.data.access_token)
                    localStorage.setItem('access_expires', moment.unix(token.data.access_expires).utc().format())
                    
                    const reqHeaders = new Headers(options.headers)
                    reqHeaders.set('Authorization', `Bearer ${token.data.access_token}`)
                    options.headers = reqHeaders

                    let refreshed: any = await fetch_retry(url, options, n - 1)
                    if(refreshed.status === 200) resolve(refreshed)
                    reject("not refreshed")
                    
                })
                .catch(err => {
                    reject(err)
                })
            } else {
               resolve(response.json())
            }
        }) 
        .catch(function(error) {
            if (n === 1) return reject(error);
            fetch_retry(url, options, n - 1)
                .then(resolve)
                .catch(reject);
        })
    });
}


