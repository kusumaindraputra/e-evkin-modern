/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('puskesmas_edit_permission', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: true },
      scope: { type: Sequelize.STRING(50), allowNull: false },
      bulan: { type: Sequelize.STRING(20), allowNull: true },
      tahun: { type: Sequelize.INTEGER, allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      start_at: { type: Sequelize.DATE, allowNull: true },
      end_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('puskesmas_edit_permission', ['user_id', 'scope', 'bulan', 'tahun']);
    await queryInterface.addIndex('puskesmas_edit_permission', ['created_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('puskesmas_edit_permission');
  },
};
