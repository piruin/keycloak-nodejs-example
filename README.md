# keycloak-nodejs-example

This is a simply Node.js REST application with access control via `keycloak.protect()` and `keycloak.enforcer()` provide in _('keycloak-connect')_.

```json
​  "dependencies": {
    ​"keycloak-connect": "7.0.1"
  }       
```

This application has endpoints protected based on Role of user
on Keycloak.

| URL                     | Method |  Roles |
|:-----------------------:|:------:|:------:|
| user                    | GET    | `not-specify` |
| roles/admin             | GET    | admin  |
| roles/advertiser        | GET    | customer-advertiser |
| roles/analyst           | GET    | customer-analyst |
| roles/adminOrAdvertiser | GET    | admin, customer-advertiser |

This applications also has REST API to work with _customers_, _campaigns_ and _reports_. We will protect all endpoints
based on permissions are configured using Keycloak.

| URL        | Method |    Permission   |   Resource   |     Scope     |                     Roles                    |
|:----------:|:------:|:---------------:|:------------:|:-------------:|:--------------------------------------------:|
| /customers | POST   | customer-create | customer | create | admin                                        |
| /customers | GET    | customer-view   | customer | view   | admin, customer-advertiser, customer-analyst |
| /campaigns | POST   | campaign-create | campaign | create | admin, customer-advertiser                   |
| /campaigns | GET    | campaign-view   | campaign | view   | admin, customer-advertiser, customer-analyst |
| /reports   | POST   | report-create   | report   | create | customer-analyst                             |
| /reports   | GET    | report-view     | report   | view   | admin, customer-advertiser, customer-analyst |

>> Note: this configure has removed res: and scope: prefix of resource name and scope name from original design at https://github.com/v-ladynev/keycloak-nodejs-example

The application will use a combination of _(resource, scope)_ to check a permission.
We will configure Keycloak to use polices are based on roles.
But for the application a combination of _(resource, scope)_ is important only.
We can configure Keycloak using something other than roles, without changing the application.

# Quick Start

You can run already configured Keycloak, using Docker and this instruction:

https://github.com/v-ladynev/keycloak-nodejs-example#using-ladynevkeycloak-mysql-realm-users-with-mysql-docker-image

## Keycloak Configuration

### Download Keycloak

Download the last version of Keycloak (this example uses 7.0.1)
http://www.keycloak.org/downloads.html

### Import Users, Realm, Client and Polices
Realm, Client and Polices configuration can be imported using this file:
[CAMPAIGN_REALM-realm.json](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/import_realm_json/CAMPAIGN_REALM-realm.json)

Users can be imported from this file:
[CAMPAIGN_REALM-users-0.json](https://github.com/v-ladynev/keycloak-nodejs-example/blob/master/import_realm_json/CAMPAIGN_REALM-users-0.json)

#### Import via Keycloak UI

You will need to select a file on the `Add Realm` page to import a realm .
https://www.keycloak.org/docs/latest/server_admin/index.html#_create-realm

Users can be imported via `Manage -> Import`

#### Import at server boot time
Export and import is triggered at server boot time and its parameters are passed in via Java system properties.
https://www.keycloak.org/docs/latest/server_admin/index.html#_export_import

### Basic configuration

1. Run server using standalone.sh (standalone.bat)

2. You should now have the Keycloak server up and running.
To check that it's working open [http://localhost:8080](http://localhost:8080).
You will need to create a Keycloak admin user.
Then click on `Admin Console` https://www.keycloak.org/docs/latest/server_admin/index.html#admin-console

When you define your initial admin account, you are creating an account in the master realm.
Your initial login to the admin console will also be through the master realm.
https://www.keycloak.org/docs/latest/server_admin/index.html#the-master-realm

3. Create a `CAMPAIGN_REALM` realm https://www.keycloak.org/docs/latest/server_admin/index.html#_create-realm

4. Create realm roles: `admin`, `customer-advertiser`, `customer-analyst`
https://www.keycloak.org/docs/latest/server_admin/index.html#realm-roles<br><br>
*Noitice*: Each client can has their own "client roles", scoped only to the client
https://www.keycloak.org/docs/latest/server_admin/index.html#client-roles

5. Create users (don't forget to disable `Temporary` password)
https://www.keycloak.org/docs/latest/server_admin/index.html#_create-new-user
  * login: `admin_user`, password: `admin_user`
  * login: `advertiser_user`, password: `advertiser_user`
  * login: `analyst_user`, password: `analyst_user`

6. Add roles to users:
* `admin_user` — `admin`
* `advertiser_user` — `customer-advertiser`
* `analyst_user` — `customer-analyst`
https://www.keycloak.org/docs/latest/server_admin/index.html#user-role-mappings

7. Create a `CAMPAIGN_CLIENT`
https://www.keycloak.org/docs/latest/server_admin/index.html#oidc-clients

  * Client ID:  `CAMPAIGN_CLIENT`
  * Client Protocol: `openid-connect`
  * Access Type:  `Confidential`
  * Standard Flow Enabled: `ON`
  * Implicit Flow Enabled: `OFF`
  * Direct Access Grants Enabled: `ON` **Important**: it should be `ON` for the custom login (to provide login/password via an application login page)
  * Service Accounts Enabled: `ON`
  * Authorization Enabled: `ON` **Important**: to add polices
  * Valid Redirect URIs: `http://localhost:3000/*`. Keycloak will use this value to check redirect URL at least for logout.
  It can be just a wildcard `*`.
  * Web Origins: `*`

### Configure permissions

#### Add polices

Using `Authorization -> Policies` add role based polices
https://www.keycloak.org/docs/latest/authorization_services/index.html#_policy_rbac

| Policy                         | Role                |
|--------------------------------|---------------------|
| Admin                          | admin               |
| Advertiser                     | customer-advertiser |
| Analyst                        | customer-analyst    |
| Admin or Advertiser or Analyst | Aggregated Policy*  |  

Aggregated Policy*
This policy consist of an aggregation of other polices
https://www.keycloak.org/docs/latest/authorization_services/index.html#_policy_aggregated  

* Polycy name: `Admin or Advertiser or Analyst`
* Apply Policy: `Admin`, `Advertiser`, `Analyst`
* Decision Strategy: `Affirmative`

 #### Add scopes

Using `Authorization -> Authorization Scopes` add scopes
  * create
  * view  

#### Add resources

Using `Authorization -> Resources` add resources. Scopes should be entered in the `Scopes` field for every resource.

| Resource Name | Scopes       |
|---------------|--------------|
| campaign      | create, view |
| customer      | create, view |
| report        | create, view |

#### Add scope-based permissions

Using `Authorization -> Permissions` add scope-based permissions
https://www.keycloak.org/docs/latest/authorization_services/index.html#_permission_create_scope

Set *decision strategy* for every permission
* Decision Strategy: `Affirmative`

|    Permission   |   Resource   |     Scope     |                     Polices                  |
|:---------------:|:------------:|:-------------:|:--------------------------------------------:|
| customer-create | customer | create | Admin                                        |
| customer-view   | customer | view   | Admin or Advertiser or Analyst               |
| campaign-create | campaign | create | Admin, Advertiser                            |
| campaign-view   | campaign | view   | Admin or Advertiser or Analyst               |
| report-create   | report   | create | Analyst                                      |
| report-view     | report   | view   | Admin or Advertiser or Analyst               |

10. Download `keycloak.json` using `CAMPAIGN_CLIENT -> Installation` :
https://www.keycloak.org/docs/latest/securing_apps/index.html#_nodejs_adapter

### Download and run application

1. Clone this project https://github.com/piruin/keycloak-nodejs-example.git

2. Replace `keycloak.json` in the [root of this project](https://github.com/piruin/keycloak-nodejs-example/blob/master/keycloak.json)
with downloaded `keycloak.json`.

3. Run `npm install` in the project directory to install Node.js libraries

4. `npm start` to run node.js application

5. import [postman collection](https://github.com/piruin/keycloak-nodejs-example/blob/master/postman/CAMPAIGN_REALM.postman_collection.json)

### Original content

This folked example project focus only about [**Node.Js Adapter**](https://www.keycloak.org/docs/latest/securing_apps/index.html#_nodejs_adapter) _('nodejs-connector')_ and how it corresponding with _Role_ _Resource_ and _Scope_ on KeyCloak. Therefor, Some original content was removed. Such as,

- [Keycloak docker image](https://github.com/v-ladynev/keycloak-nodejs-example#keycloak-docker-image)
- [Examples of using Admin REST API and Custom Login](https://github.com/v-ladynev/keycloak-nodejs-example#examples-of-using-admin-rest-api-and-custom-login)

See https://github.com/v-ladynev/keycloak-nodejs-example for full information
