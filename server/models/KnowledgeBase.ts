import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface KnowledgeBaseAttributes {
  id: number;
  source: string;
  source_id: string;
  chunk_index: number;
  chunk_content: string;
  embeddings_768?: number[] | null;
  embeddings_1536?: number[] | null;
  created_at?: Date;
  updated_at?: Date;
}

interface KnowledgeBaseCreationAttributes
  extends Optional<
    KnowledgeBaseAttributes,
    'id' | 'created_at' | 'updated_at'
  > {}

class KnowledgeBase
  extends Model<KnowledgeBaseAttributes, KnowledgeBaseCreationAttributes>
  implements KnowledgeBaseAttributes
{
  public id!: number;
  public source!: string;
  public source_id!: string;
  public chunk_index!: number;
  public chunk_content!: string;
  public embeddings_768?: number[] | null;
  public embeddings_1536?: number[] | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

KnowledgeBase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    source_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    chunk_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    chunk_content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embeddings_768: {
      type: 'VECTOR(768)',
      allowNull: true,
      set(value: number[] | null) {
        if (value) {
          // Convert array to pgvector format string
          this.setDataValue('embeddings_768' as any, `[${value.join(',')}]`);
        } else {
          this.setDataValue('embeddings_768' as any, null);
        }
      },
      get() {
        const raw = this.getDataValue('embeddings_768' as any);
        if (!raw) return null;
        // Parse pgvector format string back to array
        const str = raw.toString();
        return str.slice(1, -1).split(',').map(Number);
      }
    },
    embeddings_1536: {
      type: 'VECTOR(1536)',
      allowNull: true,
      set(value: number[] | null) {
        if (value) {
          // Convert array to pgvector format string
          this.setDataValue('embeddings_1536' as any, `[${value.join(',')}]`);
        } else {
          this.setDataValue('embeddings_1536' as any, null);
        }
      },
      get() {
        const raw = this.getDataValue('embeddings_1536' as any);
        if (!raw) return null;
        // Parse pgvector format string back to array
        const str = raw.toString();
        return str.slice(1, -1).split(',').map(Number);
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'knowledge_base',
    timestamps: true,
    underscored: true,
  }
);

export default KnowledgeBase;
