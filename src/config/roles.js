const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers', 'manageAdmin'],
  superAdmin: ['manageAdmin'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
