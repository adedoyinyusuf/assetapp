"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CApps%5Cassetapp%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CApps%5Cassetapp&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CApps%5Cassetapp%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CApps%5Cassetapp&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Apps_assetapp_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"C:\\\\Apps\\\\assetapp\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Apps_assetapp_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDQXBwcyU1Q2Fzc2V0YXBwJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDQXBwcyU1Q2Fzc2V0YXBwJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDVztBQUN4RjtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL2Fzc2V0YXBwLz81MTdjIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXEFwcHNcXFxcYXNzZXRhcHBcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwic3RhbmRhbG9uZVwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hdXRoL1suLi5uZXh0YXV0aF1cIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXEFwcHNcXFxcYXNzZXRhcHBcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CApps%5Cassetapp%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CApps%5Cassetapp&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/auth/[...nextauth]/route.ts":
/*!*********************************************!*\
  !*** ./app/api/auth/[...nextauth]/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _lib_auth_auth_options__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth/auth-options */ \"(rsc)/./lib/auth/auth-options.ts\");\n\n\n// Export the NextAuth handler with our options\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(_lib_auth_auth_options__WEBPACK_IMPORTED_MODULE_1__.authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFpQztBQUNxQjtBQUV0RCwrQ0FBK0M7QUFDL0MsTUFBTUUsVUFBVUYsZ0RBQVFBLENBQUNDLCtEQUFXQTtBQUVPIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYXNzZXRhcHAvLi9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50cz9jOGE0Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBOZXh0QXV0aCBmcm9tICduZXh0LWF1dGgnO1xuaW1wb3J0IHsgYXV0aE9wdGlvbnMgfSBmcm9tICdAL2xpYi9hdXRoL2F1dGgtb3B0aW9ucyc7XG5cbi8vIEV4cG9ydCB0aGUgTmV4dEF1dGggaGFuZGxlciB3aXRoIG91ciBvcHRpb25zXG5jb25zdCBoYW5kbGVyID0gTmV4dEF1dGgoYXV0aE9wdGlvbnMpO1xuXG5leHBvcnQgeyBoYW5kbGVyIGFzIEdFVCwgaGFuZGxlciBhcyBQT1NUIH07XG4iXSwibmFtZXMiOlsiTmV4dEF1dGgiLCJhdXRoT3B0aW9ucyIsImhhbmRsZXIiLCJHRVQiLCJQT1NUIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/auth/[...nextauth]/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/auth/auth-options.ts":
/*!**********************************!*\
  !*** ./lib/auth/auth-options.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n\n\n\nconst prisma = new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nconst authOptions = {\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_2__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    throw new Error(\"Email and password are required\");\n                }\n                try {\n                    const user = await prisma.user.findUnique({\n                        where: {\n                            email: credentials.email\n                        },\n                        include: {\n                            role: {\n                                include: {\n                                    permissions: {\n                                        include: {\n                                            permission: true\n                                        }\n                                    }\n                                }\n                            }\n                        }\n                    });\n                    if (!user || !user.isActive) {\n                        throw new Error(\"Invalid email or password\");\n                    }\n                    const isPasswordValid = await (0,bcryptjs__WEBPACK_IMPORTED_MODULE_1__.compare)(credentials.password, user.password);\n                    if (!isPasswordValid) {\n                        throw new Error(\"Invalid email or password\");\n                    }\n                    // Update last login time\n                    await prisma.user.update({\n                        where: {\n                            id: user.id\n                        },\n                        data: {\n                            lastLogin: new Date()\n                        }\n                    });\n                    // Return user data for the session\n                    return {\n                        id: user.id,\n                        email: user.email,\n                        firstName: user.firstName,\n                        lastName: user.lastName,\n                        role: user.role.name,\n                        isActive: user.isActive,\n                        lastLogin: user.lastLogin,\n                        permissions: user.role.permissions.map((p)=>p.permission.name)\n                    };\n                } catch (error) {\n                    console.error(\"Authentication error:\", error);\n                    return null;\n                }\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                return {\n                    ...token,\n                    id: user.id,\n                    email: user.email,\n                    firstName: user.firstName,\n                    lastName: user.lastName,\n                    role: user.role,\n                    isActive: user.isActive,\n                    lastLogin: user.lastLogin,\n                    permissions: user.permissions\n                };\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (token) {\n                session.user = {\n                    ...session.user,\n                    id: token.id,\n                    email: token.email,\n                    firstName: token.firstName,\n                    lastName: token.lastName,\n                    role: token.role,\n                    isActive: token.isActive,\n                    lastLogin: token.lastLogin,\n                    permissions: token.permissions\n                };\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/auth/signin\",\n        signOut: \"/auth/signout\",\n        error: \"/auth/error\"\n    },\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60,\n        updateAge: 24 * 60 * 60\n    },\n    secret: process.env.NEXTAUTH_SECRET,\n    debug: \"development\" === \"development\"\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QixNQUFNNUIsS0FBSztvQkFDbEJvQixXQUFXUSxNQUFNUixTQUFTO29CQUMxQkMsVUFBVU8sTUFBTVAsUUFBUTtvQkFDeEJYLE1BQU1rQixNQUFNbEIsSUFBSTtvQkFDaEJHLFVBQVVlLE1BQU1mLFFBQVE7b0JBQ3hCSyxXQUFXVSxNQUFNVixTQUFTO29CQUMxQlAsYUFBYWlCLE1BQU1qQixXQUFXO2dCQUNoQztZQUNGO1lBQ0EsT0FBT2tCO1FBQ1Q7SUFDRjtJQUNBQyxPQUFPO1FBQ0xDLFFBQVE7UUFDUkMsU0FBUztRQUNUUixPQUFPO0lBQ1Q7SUFDQUssU0FBUztRQUNQSSxVQUFVO1FBQ1ZDLFFBQVEsS0FBSyxLQUFLLEtBQUs7UUFDdkJDLFdBQVcsS0FBSyxLQUFLO0lBQ3ZCO0lBQ0FDLFFBQVFDLFFBQVFDLEdBQUcsQ0FBQ0MsZUFBZTtJQUNuQ0MsT0FBT0gsa0JBQXlCO0FBQ2xDLEVBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hc3NldGFwcC8uL2xpYi9hdXRoL2F1dGgtb3B0aW9ucy50cz9hMDlhIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuaW1wb3J0IHsgY29tcGFyZSB9IGZyb20gXCJiY3J5cHRqc1wiO1xuaW1wb3J0IHsgdHlwZSBBdXRoT3B0aW9ucyB9IGZyb20gXCJuZXh0LWF1dGhcIjtcbmltcG9ydCB0eXBlIHsgRGVmYXVsdFNlc3Npb24sIERlZmF1bHRVc2VyIH0gZnJvbSBcIm5leHQtYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBEZWZhdWx0SldUIH0gZnJvbSBcIm5leHQtYXV0aC9qd3RcIjtcbmltcG9ydCBDcmVkZW50aWFsc1Byb3ZpZGVyIGZyb20gXCJuZXh0LWF1dGgvcHJvdmlkZXJzL2NyZWRlbnRpYWxzXCI7XG5pbXBvcnQgeyBVc2VyUm9sZSB9IGZyb20gXCIuL3JvbGVzXCI7XG5cbmRlY2xhcmUgbW9kdWxlIFwibmV4dC1hdXRoXCIge1xuICBpbnRlcmZhY2UgVXNlciBleHRlbmRzIERlZmF1bHRVc2VyIHtcbiAgICBmaXJzdE5hbWU6IHN0cmluZyB8IG51bGw7XG4gICAgbGFzdE5hbWU6IHN0cmluZyB8IG51bGw7XG4gICAgcm9sZTogVXNlclJvbGU7XG4gICAgaXNBY3RpdmU6IGJvb2xlYW47XG4gICAgbGFzdExvZ2luOiBEYXRlIHwgbnVsbDtcbiAgICBwZXJtaXNzaW9uczogc3RyaW5nW107XG4gIH1cbiAgXG4gIGludGVyZmFjZSBTZXNzaW9uIGV4dGVuZHMgRGVmYXVsdFNlc3Npb24ge1xuICAgIHVzZXI6IFVzZXI7XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgXCJuZXh0LWF1dGgvand0XCIge1xuICBpbnRlcmZhY2UgSldUIGV4dGVuZHMgRGVmYXVsdEpXVCB7XG4gICAgZmlyc3ROYW1lPzogc3RyaW5nIHwgbnVsbDtcbiAgICBsYXN0TmFtZT86IHN0cmluZyB8IG51bGw7XG4gICAgcm9sZT86IFVzZXJSb2xlO1xuICAgIGlzQWN0aXZlPzogYm9vbGVhbjtcbiAgICBsYXN0TG9naW4/OiBEYXRlIHwgbnVsbDtcbiAgICBwZXJtaXNzaW9ucz86IHN0cmluZ1tdO1xuICB9XG59XG5cbmludGVyZmFjZSBVc2VyV2l0aFBlcm1pc3Npb25zIHtcbiAgaWQ6IHN0cmluZztcbiAgZW1haWw6IHN0cmluZztcbiAgZmlyc3ROYW1lOiBzdHJpbmcgfCBudWxsO1xuICBsYXN0TmFtZTogc3RyaW5nIHwgbnVsbDtcbiAgcm9sZToge1xuICAgIG5hbWU6IFVzZXJSb2xlO1xuICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICBwZXJtaXNzaW9uOiB7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgIH1cbiAgICB9W107XG4gIH07XG4gIGlzQWN0aXZlOiBib29sZWFuO1xuICBsYXN0TG9naW46IERhdGUgfCBudWxsO1xuICBwYXNzd29yZDogc3RyaW5nO1xufVxuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogQXV0aE9wdGlvbnMgPSB7XG4gIHByb3ZpZGVyczogW1xuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xuICAgICAgbmFtZTogJ2NyZWRlbnRpYWxzJyxcbiAgICAgIGNyZWRlbnRpYWxzOiB7XG4gICAgICAgIGVtYWlsOiB7IGxhYmVsOiBcIkVtYWlsXCIsIHR5cGU6IFwiZW1haWxcIiB9LFxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogXCJQYXNzd29yZFwiLCB0eXBlOiBcInBhc3N3b3JkXCIgfVxuICAgICAgfSxcbiAgICAgIGFzeW5jIGF1dGhvcml6ZShjcmVkZW50aWFscykge1xuICAgICAgICBpZiAoIWNyZWRlbnRpYWxzPy5lbWFpbCB8fCAhY3JlZGVudGlhbHM/LnBhc3N3b3JkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbWFpbCBhbmQgcGFzc3dvcmQgYXJlIHJlcXVpcmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCB9LFxuICAgICAgICAgICAgaW5jbHVkZToge1xuICAgICAgICAgICAgICByb2xlOiB7XG4gICAgICAgICAgICAgICAgaW5jbHVkZToge1xuICAgICAgICAgICAgICAgICAgcGVybWlzc2lvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZToge1xuICAgICAgICAgICAgICAgICAgICAgIHBlcm1pc3Npb246IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pIGFzIFVzZXJXaXRoUGVybWlzc2lvbnMgfCBudWxsO1xuXG4gICAgICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyLmlzQWN0aXZlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZW1haWwgb3IgcGFzc3dvcmQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBpc1Bhc3N3b3JkVmFsaWQgPSBhd2FpdCBjb21wYXJlKGNyZWRlbnRpYWxzLnBhc3N3b3JkLCB1c2VyLnBhc3N3b3JkKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoIWlzUGFzc3dvcmRWYWxpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGVtYWlsIG9yIHBhc3N3b3JkJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVXBkYXRlIGxhc3QgbG9naW4gdGltZVxuICAgICAgICAgIGF3YWl0IHByaXNtYS51c2VyLnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogdXNlci5pZCB9LFxuICAgICAgICAgICAgZGF0YTogeyBsYXN0TG9naW46IG5ldyBEYXRlKCkgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFJldHVybiB1c2VyIGRhdGEgZm9yIHRoZSBzZXNzaW9uXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiB1c2VyLmlkLFxuICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgICBmaXJzdE5hbWU6IHVzZXIuZmlyc3ROYW1lLFxuICAgICAgICAgICAgbGFzdE5hbWU6IHVzZXIubGFzdE5hbWUsXG4gICAgICAgICAgICByb2xlOiB1c2VyLnJvbGUubmFtZSBhcyBVc2VyUm9sZSxcbiAgICAgICAgICAgIGlzQWN0aXZlOiB1c2VyLmlzQWN0aXZlLFxuICAgICAgICAgICAgbGFzdExvZ2luOiB1c2VyLmxhc3RMb2dpbixcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB1c2VyLnJvbGUucGVybWlzc2lvbnMubWFwKChwOiB7IHBlcm1pc3Npb246IHsgbmFtZTogc3RyaW5nIH0gfSkgPT4gcC5wZXJtaXNzaW9uLm5hbWUpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignQXV0aGVudGljYXRpb24gZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuICBjYWxsYmFja3M6IHtcbiAgICBhc3luYyBqd3QoeyB0b2tlbiwgdXNlciB9KSB7XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnRva2VuLFxuICAgICAgICAgIGlkOiB1c2VyLmlkLFxuICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICAgIGZpcnN0TmFtZTogdXNlci5maXJzdE5hbWUsXG4gICAgICAgICAgbGFzdE5hbWU6IHVzZXIubGFzdE5hbWUsXG4gICAgICAgICAgcm9sZTogdXNlci5yb2xlIGFzIFVzZXJSb2xlLFxuICAgICAgICAgIGlzQWN0aXZlOiB1c2VyLmlzQWN0aXZlLFxuICAgICAgICAgIGxhc3RMb2dpbjogdXNlci5sYXN0TG9naW4sXG4gICAgICAgICAgcGVybWlzc2lvbnM6IHVzZXIucGVybWlzc2lvbnMsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfSxcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIHNlc3Npb24udXNlciA9IHtcbiAgICAgICAgICAuLi5zZXNzaW9uLnVzZXIsXG4gICAgICAgICAgaWQ6IHRva2VuLmlkIGFzIHN0cmluZyxcbiAgICAgICAgICBlbWFpbDogdG9rZW4uZW1haWwgYXMgc3RyaW5nLFxuICAgICAgICAgIGZpcnN0TmFtZTogdG9rZW4uZmlyc3ROYW1lIGFzIHN0cmluZyB8IG51bGwsXG4gICAgICAgICAgbGFzdE5hbWU6IHRva2VuLmxhc3ROYW1lIGFzIHN0cmluZyB8IG51bGwsXG4gICAgICAgICAgcm9sZTogdG9rZW4ucm9sZSBhcyBVc2VyUm9sZSxcbiAgICAgICAgICBpc0FjdGl2ZTogdG9rZW4uaXNBY3RpdmUgYXMgYm9vbGVhbixcbiAgICAgICAgICBsYXN0TG9naW46IHRva2VuLmxhc3RMb2dpbiBhcyBEYXRlIHwgbnVsbCxcbiAgICAgICAgICBwZXJtaXNzaW9uczogdG9rZW4ucGVybWlzc2lvbnMgYXMgc3RyaW5nW10sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gc2Vzc2lvbjtcbiAgICB9LFxuICB9LFxuICBwYWdlczoge1xuICAgIHNpZ25JbjogJy9hdXRoL3NpZ25pbicsXG4gICAgc2lnbk91dDogJy9hdXRoL3NpZ25vdXQnLFxuICAgIGVycm9yOiAnL2F1dGgvZXJyb3InLFxuICB9LFxuICBzZXNzaW9uOiB7XG4gICAgc3RyYXRlZ3k6IFwiand0XCIsXG4gICAgbWF4QWdlOiAzMCAqIDI0ICogNjAgKiA2MCwgLy8gMzAgZGF5c1xuICAgIHVwZGF0ZUFnZTogMjQgKiA2MCAqIDYwLCAvLyAyNCBob3Vyc1xuICB9LFxuICBzZWNyZXQ6IHByb2Nlc3MuZW52Lk5FWFRBVVRIX1NFQ1JFVCxcbiAgZGVidWc6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnLFxufTtcbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJjb21wYXJlIiwiQ3JlZGVudGlhbHNQcm92aWRlciIsInByaXNtYSIsImF1dGhPcHRpb25zIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsIkVycm9yIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsImluY2x1ZGUiLCJyb2xlIiwicGVybWlzc2lvbnMiLCJwZXJtaXNzaW9uIiwiaXNBY3RpdmUiLCJpc1Bhc3N3b3JkVmFsaWQiLCJ1cGRhdGUiLCJpZCIsImRhdGEiLCJsYXN0TG9naW4iLCJEYXRlIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJtYXAiLCJwIiwiZXJyb3IiLCJjb25zb2xlIiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJzZXNzaW9uIiwicGFnZXMiLCJzaWduSW4iLCJzaWduT3V0Iiwic3RyYXRlZ3kiLCJtYXhBZ2UiLCJ1cGRhdGVBZ2UiLCJzZWNyZXQiLCJwcm9jZXNzIiwiZW52IiwiTkVYVEFVVEhfU0VDUkVUIiwiZGVidWciXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/auth/auth-options.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/uuid","vendor-chunks/oauth","vendor-chunks/@panva","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/bcryptjs","vendor-chunks/preact","vendor-chunks/oidc-token-hash","vendor-chunks/cookie"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CApps%5Cassetapp%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CApps%5Cassetapp&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();