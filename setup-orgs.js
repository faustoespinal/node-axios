const axios = require('axios');
const YAML  = require('yaml');
const https = require('https');
const qs = require('qs');
const fs = require('fs');

const axios_instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
});

console.log('Setup keycloak');
const keycloak_root = process.env.KEYCLOAK_SVC_ROOT;
const admin_usr = process.env.KEYCLOAK_ADMIN_USR;
const admin_pwd = process.env.KEYCLOAK_ADMIN_PWD;

const getAccessToken = async () => {
  try {
    data = {
      client_id: 'admin-cli',
      username: admin_usr,
      password: admin_pwd,
      grant_type: 'password'
    };
    tokencall_config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: admin_usr,
        password: admin_pwd
      },
      responseType: 'json' // default
    };
    const resp = await axios_instance.post(keycloak_root + '/auth/realms/master/protocol/openid-connect/token', qs.stringify(data), tokencall_config);
    data = resp.data;
    access_token = data.access_token;
    refresh_token = data.refresh_token;
    console.log('Tokens: ' + access_token + "    " + refresh_token);
    return [ access_token, refresh_token ];
  } catch (error) {
    console.error("**** ERROR:", error);
  };
}

const createOrganization = async(credentials,org) => {
  console.log("Creating organization: ",org.name);
  realm_data = {
    "realm":org.id,
    "notBefore":0,
    "enabled":true,
    "sslRequired":"all",
    "bruteForceProtected":true,
    "failureFactor":10,
    "eventsEnabled":false,
    "loginTheme": "keycloak",
    "displayName": org.name,
  };
  access_token = credentials[0];
  try {
    // Create realm
    realmcreate_config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+access_token
      },
      responseType: 'json'
    };
    const realm_resp = await axios_instance.post(keycloak_root+'/auth/admin/realms',realm_data,realmcreate_config);     
    rc_data = realm_resp.data;
    console.log('Realm Data:',realm_resp.status);    
  } catch (error) {
    console.error("**** ERROR:", error.response.status);
  }
  console.log("====================================")  
}

const createClient = async(credentials,realm,client) => {
  console.log("** Creating client: ",client.name,"in realm",realm);
  client_data = {
    "clientId": client.name,
    "name": client.name,
    "description": client.description,
    "enabled": true,
    "rootUrl":"http://medi-paas/"+client.name+"/",
    "adminUrl":"http://medi-paas/"+client.name+"/"
  };
  access_token = credentials[0];
  try {
    // Create realm
    clientcreate_config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+access_token
      },
      responseType: 'json'
    };
    const client_resp = await axios_instance.post(keycloak_root+'/auth/admin/realms/'+realm+'/clients',client_data,clientcreate_config);     
    rc_data = client_resp.data;
    console.log('Client Data:',client_resp.status,client_resp.statusText);  
    return rc_data;  
  } catch (error) {
    console.error("**** ERROR:", error.response.status);
  }
  console.log("====================================");
}

// Creates the client-specific roles for a given client
const createRolesClient = async (credentials, realm, client, client_map) => {
  access_token = credentials[0];
  try {
    // Create role
    rolecreate_config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      responseType: 'json'
    };

    const clientId = client.name;
    const roles = client.roles;
    var rc_data = {};

    const response = await axios_instance.get(keycloak_root + '/auth/admin/realms/' + realm + '/clients?clientId=' + clientId, rolecreate_config);
    const client_info = response.data[0];
    client.data = client_info;
    client_map[clientId] = client_info;

    for (var i = 0; i < roles.length; i++) {
      role = roles[i];
      if (role.scope === 'private') {
        role_data = {
          "id": role.name,
          "name": role.name,
          "description": role.name,
          "clientRole": true,
        };

        api_url = keycloak_root + '/auth/admin/realms/' + realm + '/clients/' + client_info.id + '/roles';
        console.log("** [", clientId, "] Creating role: ", role.name, "in realm", realm, "for client.id", client_info.id, ' api_url=[', api_url, ']');
        const role_resp = await axios_instance.post(api_url, role_data, rolecreate_config);
        rc_data = role_resp.data;
        console.log('Client-role create:', role_resp.status);
      }
    }
    return rc_data;
  } catch (error) {
    console.error("**** ERROR:", error.response.status, error.response.statusText);
  }
  return client_map;
}

// Obtains all registered groups and roles and associates them to the appropiate in-memory records
const getGroupsAndRoles = async (credentials, realm, groups, clients) => {
  access_token = credentials[0];
  try {
    // Create group
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      responseType: 'json'
    };

    const response = await axios_instance.get(keycloak_root + '/auth/admin/realms/' + realm + '/groups', config);
    console.log("groups-->",response.status);
    const groups_info = response.data;

    for(var i=0;i<groups_info.length;i++) {
      for(var j=0;j<groups.length;j++) {
        if (groups_info[i].name===groups[j].name) {
          // Attach full payload to the in-memory groups element.
          groups[j].data = groups_info[i];
        }
      }
    }

    for(var i=0;i<clients.length;i++) {
      clientName = clients[i].name;
      scope = clients[i].scope;
      id = clients[i].data.id;
      const roles_response = await axios_instance.get(keycloak_root + '/auth/admin/realms/' + realm + '/clients/'+id+'/roles', config);
      clients[i].roles_data = roles_response.data;
      clients[i].data.roles_data = roles_response.data;
      console.log("roles--> [",clientName,"] : ",roles_response.status);
    }
  } catch (error) {
    console.error("**** ERROR:", error.response.status, error.response.statusText);
  }
}

// Creates the specified group
const createGroup = async (credentials, realm, group) => {
  access_token = credentials[0];
  try {
    // Create group
    create_config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      responseType: 'json'
    };

    const groupId = group.name;
    var rc_data = {};
   
    group_data = {
      "name": groupId,
      "clientRoles": {}
    };
    api_url = keycloak_root + '/auth/admin/realms/' + realm + '/groups';
    console.log("** Creating group: ", groupId, "in realm", realm, '[',api_url,']');
    const group_resp = await axios_instance.post(api_url, group_data, create_config);
    rc_data = group_resp.data;
    const status = group_resp.status;
    console.log('Group create response:', status);
    return rc_data;
  } catch (error) {
    console.error("**** ERROR:", error.response.status, error.response.statusText);
  }
}

// Creates the specified group-role mappings
const createGroupRoleMappings = async (credentials, realm, groups, client_map) => {
  access_token = credentials[0];
  try {
    // Create group
    create_config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      responseType: 'json'
    };

    for (var i = 0; i < groups.length; i++) {
      const group_id = groups[i].data.id;
      const group_clients = groups[i].clients;

      for (var j = 0; j < group_clients.length; j++) {
        clientId = group_clients[j];
        id_client = client_map[clientId].id;
        api_url = keycloak_root + '/auth/admin/realms/' + realm + '/groups/' + group_id + '/role-mappings/clients/' + id_client;
        console.log("** Creating group/role: group=", group_id, "client=",id_client, "in realm", realm, '[', api_url, ']');
        // Get all the roles attached to that client.
        role_data = client_map[clientId].roles_data;
        
        const grouprole_resp = await axios_instance.post(api_url, role_data, create_config);
        rc_data = grouprole_resp.data;
        const status = grouprole_resp.status;
        console.log('Group-role mapping create response:', status);
      }
    }
  } catch (error) {
    console.error("**** ERROR:", error.status, error.statusText);
  }
}

// Creates the specified user
const createUser = async (credentials, realm, user) => {
  access_token = credentials[0];
  try {
    // Create user
    create_config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      responseType: 'json'
    };

    const username = user.name;
    const groups = user.groups;
    var rc_data = {};
    user_data = {
      "username": username,
      "firstName": username,
      "groups": groups,
      "email": username+'@'+realm+'.org'
    };
    api_url = keycloak_root + '/auth/admin/realms/' + realm + '/users';
    console.log("** Creating user: ", username, "in realm", realm, '[',api_url,']');
    const user_resp = await axios_instance.post(api_url, user_data, create_config);
    rc_data = user_resp.data;
    const status = user_resp.status;
    console.log('User create response:', status);
    return rc_data;
  } catch (error) {
    console.error("**** ERROR:", error.response.status, error.response.statusText);
  }
  console.log("----------------");
}

const setupKeycloak = async(orgdata) => {
  console.log(JSON.stringify(orgdata, null, 4));
  const organizations = orgdata.organizations;
  const clients = orgdata.clients;
  const credentials = await getAccessToken();
  if (credentials) {
    for (var i = 0; i < organizations.length; i++) {
      result=await createOrganization(credentials, organizations[i]);
    }
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    for (var i = 0; i < organizations.length; i++) {
      const realm = organizations[i].id;
      for (var j = 0; j < clients.length; j++) {
        result=await createClient(credentials, realm, clients[j]);
      }
    }
    console.log('##################################');
    console.log('##################################');
    for (var i = 0; i < organizations.length; i++) {
      const realm = organizations[i].id;
      const groups = organizations[i].groups;
      const users = organizations[i].users;
      client_map = {};
      for (var j = 0; j < clients.length; j++) {
        await createRolesClient(credentials, realm, clients[j],client_map);
      }
      console.log('##################################');
      for (var j = 0; j < groups.length; j++) {
        await createGroup(credentials, realm, groups[j]);
      }
      await getGroupsAndRoles(credentials,realm,groups,clients);
      await createGroupRoleMappings(credentials, realm, groups, client_map);
      console.log('##################################');
      for (var j = 0; j < users.length; j++) {
        result=await createUser(credentials, realm, users[j]);
      }
    }
  }
}

const myArgs = process.argv.slice(2);
if (myArgs.length>0) {
    const file = fs.readFileSync(myArgs[0], 'utf8')
    orgData = YAML.parse(file)
    setupKeycloak(orgData);
    console.log("@@@@@@@@@@@@ DONE!!!!!!!!!");
} else {
    console.error("Input YAML file not given!!")
}
