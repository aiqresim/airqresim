import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanPricesTable1633090816159 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE plan_prices (`);
    await queryRunner.query(`  plan_id INT,`);
    await queryRunner.query(`  currency VARCHAR(3),`);
    await queryRunner.query(`  price_cents INT,`);
    await queryRunner.query(`  PRIMARY KEY (plan_id, currency)`);
    await queryRunner.query(`);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE plan_prices;`);
  }
}