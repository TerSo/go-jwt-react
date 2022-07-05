import IconButton from '@mui/material/IconButton';
import LoginIcon from '@mui/icons-material/Login';
import { Link } from 'react-router-dom';
import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import ApiService from '../../services/ApiService'
import {AlertContext} from '../alerts/AlertContext'

const Api = new ApiService()
const bc = new BroadcastChannel('auth-notification')

export const LoginButton = (props: any) => {
  const [alert, setAlert] =  React.useContext(AlertContext);
    const [username, setUsername] = React.useState(localStorage.getItem('full_name'))
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    };
    const handleClose = () => {
        setAnchorEl(null)
    }

    const login = () => {
      window.location.href="/login"
    }

    const logout = () => {
      Api.logout()
      .then((response:any) => {
          if(response.status !== 200) {
            setAlert({visible: true, message: response.statusText, type: 'error'})
          } else {
            localStorage.clear()
            setUsername("")
            bc.postMessage('logout')
          }
      })
      .catch( (error:any) => {
          setAlert({visible: true, message: "An error occurred during logout", type: 'error'})
      })
    }

    if(!username || username === "") {
        return (
            <IconButton  onClick={login} aria-label="login" size="large" color="inherit">
                <LoginIcon />
            </IconButton>
        )
    }

    return (
        <React.Fragment>
        <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
          <Typography sx={{ minWidth: 100 }}>{username}</Typography>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}>
                <Avatar sx={{ width: 32, height: 32 }} src="" />
            </IconButton>
          </Tooltip>
        </Box>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem>
            <Avatar /> Profile
          </MenuItem>
          <Divider />
          <MenuItem>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem onClick={logout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </React.Fragment>
    )
    
}
