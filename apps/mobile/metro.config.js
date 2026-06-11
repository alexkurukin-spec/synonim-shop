// Expo Metro (приложение автономно — вне npm-workspaces, своё node_modules).
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

module.exports = config
