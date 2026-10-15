import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity.js';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @Column({ name: 'nombre_rol', type: 'varchar', length: 50, unique: true })
  nombre_rol: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @OneToMany(() => User, (user) => user.rol)
  usuarios: User[];
}
