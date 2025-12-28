/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Make this migration resilient if table doesn't exist yet
    await queryInterface.sequelize.query(
      'ALTER TABLE IF EXISTS "puskesmas_edit_permission" ALTER COLUMN "user_id" DROP NOT NULL;'
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE IF EXISTS "puskesmas_edit_permission" ALTER COLUMN "user_id" SET NOT NULL;'
    );
  },
};
