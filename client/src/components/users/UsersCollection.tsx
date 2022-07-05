import React , { useState , useEffect, useContext } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ApiService from '../../services/ApiService'
import {AlertContext} from '../alerts/AlertContext'

const Api = new ApiService()


export default function UsersCollection() {

    const [users, setUsers] = useState([]);
    const [alert, setAlert] = useContext(AlertContext);

    useEffect(()=>{
        Api.getUsers()
        .then((response:any) => {
            if(response && response.status === 200) {
                setUsers(response.data.data)
            } else {
                setAlert({visible: true, message: response, type: 'error'})
            }
        })
        .catch(error => {
            setAlert({visible: true, message: error, type: 'error'})
        })
      },[])

    return (
        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {users.map( (user:any) => (
                <ListItem alignItems="flex-start"  key={user.ID}>
                    <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src="" />
                    </ListItemAvatar>
                    <ListItemText
                    primary={user.name + " " + user.surname}
                    secondary={
                        <React.Fragment>
                        <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                        > 
                        </Typography>
                        {user.email}
                        </React.Fragment>
                    }
                    />
                </ListItem>
            ))}
        </List>
    )
}