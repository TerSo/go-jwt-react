
import moment from "moment"

export default function SetJWToken(data:Object): void {
    for (let [key, value] of Object.entries(data)) { 
       let val = key === "access_expires" || key ==="refresh_expires" ?  moment.unix(value).utc().format() : value
        localStorage.setItem(key, val)
    }
}


/*
export default function SetJWToken(token:string): void {
    let decoded = decodeToken(token)
    if(decoded) {
        localStorage.setItem('user', decoded.name + " " + decoded.surname)
        localStorage.setItem('exp', decoded.exp)
        localStorage.setItem('accessToken', token)
    }
}
*/