import React, {useState} from 'react';
import clsx from 'clsx';
import { makeStyles, useTheme, Theme, createStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import { Link, BrowserRouter, useLocation } from "react-router-dom";
import {MenuItems, AppRoutes} from "../routes"
import {LoginButton} from './authentication/LoginButton';

import {AlertContext} from './alerts/AlertContext';
import {TransitionAlerts} from './alerts/TransitionAlerts';

//import {AlertProvider} from './alert/AlertProvider'
//import {TransitionAlert} from './shared/TransitionAlert'

const drawerWidth = 240;
const channel = new BroadcastChannel('auth-notification');


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      // necessary for content to be below app bar
      ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    },
    loginButton: {
      marginLeft: 'auto'
    }
  }),
);

export default function Layout() {
  const classes = useStyles();
  const theme = useTheme();
 
  const [open, setOpen] = React.useState(false);

  const [alert, setAlert] = useState({type: 'info', message: 'no messsage', visible: false});

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  channel.onmessage = event => { 
    switch(event.data) {
      case "logout":
        window.location.href="/"
        break
    }
  }
  
  return (
    <div className={classes.root}>    
     <AlertContext.Provider value={[alert, setAlert]}>   
      <BrowserRouter>
          <CssBaseline />
          <AppBar
            position="fixed"
            className={clsx(classes.appBar, {
              [classes.appBarShift]: open,
            })}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                className={clsx(classes.menuButton, open && classes.hide)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap>
                <BarTitle />
              </Typography>
              <div className={classes.loginButton}>
                <LoginButton />
              </div>
            
            </Toolbar>
          </AppBar>
          <Drawer
            className={classes.drawer}
            variant="persistent"
            anchor="left"
            open={open}
            classes={{
              paper: classes.drawerPaper,
            }}
          >
            <div className={classes.drawerHeader}>
              <IconButton onClick={handleDrawerClose}>
                {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </div>
            <Divider />
            <List>
              {MenuItems.map((item) => (
                <ListItem key={item.text} component={Link} to={"/" + item.path}>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Drawer>
         
          <main className={clsx(classes.content, { [classes.contentShift]: open })}>
            <div className={classes.drawerHeader} />
              <TransitionAlerts />
            
              <AppRoutes />
             
          </main>
         
      </BrowserRouter>
      </AlertContext.Provider>
    </div>
  );
}

const BarTitle = () => {
  const location = useLocation();
  return (
    <div>
      <b>{location.pathname}</b>
    </div>
  );
};
