const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NativeAiCall = sequelize.define('NativeAiCall', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    agent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'native_ai_agents',
        key: 'id'
      },
      onDelete: 'CASCADE',
    },
    client_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    client_name: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    threecx_call_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'The call ID returned by 3CX ActiveCalls or MakeCall',
    },
    threecx_recording_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    direction: {
      type: DataTypes.ENUM('inbound', 'outbound'),
      allowNull: false,
      defaultValue: 'outbound',
    },
    status: {
      type: DataTypes.ENUM('pending', 'initiated', 'ringing', 'connected', 'completed', 'failed', 'canceled'),
      defaultValue: 'pending',
    },
    duration_seconds: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    recording_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dynamic_context: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Runtime data provided to the AI Agent for this call',
    },
    call_metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional external metadata (e.g., CRM IDs, campaign ID)',
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    answered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'native_ai_calls',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['company_id', 'agent_id', 'status'],
        name: 'idx_native_ai_call_company_agent_status'
      },
      {
        unique: true,
        fields: ['threecx_call_id'],
        name: 'uq_native_ai_call_threecx_id'
      },
      {
        fields: ['client_phone'],
        name: 'idx_native_ai_call_phone'
      }
    ]
  });

  return NativeAiCall;
};
