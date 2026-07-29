const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NativeAiAgent = sequelize.define('NativeAiAgent', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    // Dynamic 3CX Config
    fqdn_3cx: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id_3cx: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_secret_3cx: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // 3CX AI Extensions
    threecx_extension: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    threecx_dn_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    department_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    outbound_caller_id: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    assigned_did: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(20),
      defaultValue: 'en',
    },
    voice_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'testing', 'error'),
      defaultValue: 'testing',
    },
    concurrency_limit: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    last_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'native_ai_agents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['company_id', 'threecx_extension'],
        name: 'uq_native_ai_agent_company_extension'
      },
      {
        fields: ['company_id', 'status'],
        name: 'idx_native_ai_agent_company_status'
      }
    ]
  });

  return NativeAiAgent;
};
