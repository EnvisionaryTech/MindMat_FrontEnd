import { Component, inject, ViewChild } from '@angular/core';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';
import { ModalService } from '../../services/modal.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMember, ITeam, IUser } from '../../interfaces';
import { LoaderComponent } from "../../components/loader/loader.component";
import { PaginationComponent } from "../../components/pagination/pagination.component";
import { TeamFormComponent } from "../../components/team/team-form/team-form.component";
import { TeamListComponent } from "../../components/team/team-list/team-list.component";
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from "../../components/modal/modal.component";
import { AvatarSelectorComponent } from '../../components/user/avatar-selector/avatar-selector.component';
import { AlertModalComponent } from '../../components/alert/alert-modal.component';
import { CommonModule } from '@angular/common';
import { computed } from '@angular/core';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    LoaderComponent, PaginationComponent, TeamFormComponent, TeamListComponent, AvatarSelectorComponent, AlertModalComponent,
    ModalComponent, CommonModule, ReactiveFormsModule
],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent {
  public teamService: TeamService = inject(TeamService);
  public authService: AuthService = inject(AuthService);
  public modalService: ModalService = inject(ModalService);
  public usersService: UserService = inject(UserService);

  public users: IUser[] = [];

  @ViewChild('addTeamsModal') public addTeamsModal: any;
  @ViewChild('addTeamMemberModal') public addTeamMemberModal: any;
  public fb: FormBuilder = inject(FormBuilder);
  teamForm = this.fb.group({
    avatarId: [''],
    id: [''],
    name: ['', Validators.required],
    description: ['', Validators.required],
    teacherLeader: ['', Validators.required]
  });
  
  isEditing: boolean = false;

  selectedTeamId: number | null = null;
  team: ITeam | null = null;
  showAvatarSelector = false;
  public teams: ITeam[] = [];

  showAlert = false;
  alertType: 'time' | 'error' | 'success' = 'success';
  alertTitle = '¡Éxito!';
  alertMessage = 'Campo avatarId actualizado con éxito';
  alertButtonText = 'Cerrar';

  @ViewChild('avatarSelectorModal') public avatarSelectorModal: any;

  selectTeam(team: ITeam) {
    this.selectedTeamId = team.id ?? null; // Si team.id es undefined, asigna null.
  }

  selectedMemberId: number | null = null;

  selectMember(member: IMember) {
    this.selectedMemberId = member.id ?? null; // Si team.id es undefined, asigna null.
  }

  
  
  memberForm = this.fb.group({
    id: ['']
  })
  
  constructor() {
    this.fetchTeams(); 
    const isAdmin = this.authService.getUser()?.role?.name === 'ADMIN';
    if (isAdmin) {
      this.teamService.getAllByUser().subscribe({
        next: (teams) => {
 },
        error: (err) => {
          console.error('Error cargando equipos:', err);
        }
      });
    } else {
      this.teamService.getAll().subscribe({
        next: (teams) => {
},
        error: (err) => {
          console.error('Error cargando todos los equipos:', err);
        }
      });
    }
  }  
  
  saveTeam(team: ITeam) {
    if (this.isEditing) {
        this.teamService.update(team).subscribe({
            next: () => {
                this.fetchTeams(); // Refrescar lista
                this.modalService.closeAll();
            },
            error: (err) => console.error('Error actualizando el equipo:', err)
        });
    } else {
        this.teamService.save(team).subscribe({
            next: () => {
                this.fetchTeams(); // Refrescar lista
                this.modalService.closeAll();
            },
            error: (err) => console.error('Error creando el equipo:', err)
        });
    }
}


  callEdition(team: ITeam) {
    this.isEditing = true;
    this.teamForm.controls['avatarId'].setValue(team.avatarId ? String(team.avatarId) : '');
    this.teamForm.controls['id'].setValue(team.id ? String(team.id) : '');
    this.teamForm.controls['name'].setValue(team.name || '');
    this.teamForm.controls['description'].setValue(team.description || '');
    //this.teamForm.controls['teacherLeader'].setValue(team.teacherLeader ? String(team.teacherLeader) : '');
    this.teamForm.controls['teacherLeader'].setValue(
      team.teacherLeader?.id ? String(team.teacherLeader.id) : '' // Asegura que sea string
    );
    
    this.modalService.displayModal('md', this.addTeamsModal);
  }

  openAddTeamModal() {
    this.isEditing = false;
    this.teamForm.reset({
      avatarId: '',
      id: '',
      name: '',
      description: '',
      teacherLeader: ''
    });
  
    this.modalService.displayModal('md', this.addTeamsModal);
  }  

  updateTeam(team: ITeam) {
    const teacherLeaderId = this.teamForm.controls['teacherLeader'].value;
  
    const updatedTeam: ITeam = {
      id: Number(this.teamForm.controls['id'].value),
      name: this.teamForm.controls['name'].value || '', // Asegura que no sea null
      description: this.teamForm.controls['description'].value || '',
      avatarId: Number(this.teamForm.controls['avatarId'].value),
      teacherLeader: {
        id: Number(teacherLeaderId), // Convertir a número
        name: '', // No es necesario enviar el nombre, el backend lo puede resolver
        lastname: '',
        email: ''
      }
    };
  
    this.teamService.update(updatedTeam).subscribe({
      next: () => {
        console.log('Equipo actualizado correctamente');
        this.fetchTeams(); // Refrescar la lista
        this.modalService.closeAll(); // Cerrar el modal
      },
      error: (err) => {
        console.error('Error actualizando el equipo:', err);
      }
    });
  }  

  fetchTeams(): void {
    this.teamService.getAll().subscribe({
      next: (teams) => {
        this.teams = teams;
        console.log('Teams fetched successfully:', teams);
      },
      error: (err) => {
        console.error('Error fetching teams:', err);
      },
    });
  }
  

  confirmDeleteTeam(team: ITeam) {
    this.modalService.displayModal('sm', {
      title: 'Confirmación',
      confirmAction: 'Sí, eliminar',
      cancelAction: 'No, cancelar',
      callConfirmationMethod: () => {
        this.deleteTeam(team); // Llamar al método de eliminación
      },
      callCancelMethod: () => {
        console.log('Eliminación cancelada.'); // Si el usuario cancela
      },
    });
  }
  
  deleteTeam(team: ITeam): void {
    if (!team || !team.id) {
      console.error('Team is invalid or does not have an ID:', team);
      return;
    }
  
    console.log('Sending delete request for team:', team);
  
    this.teamService.deleteTeam(team.id).subscribe({
      next: () => {
        console.log(`Team ${team.name} deleted successfully.`);
        this.fetchTeams(); // Refresca la lista de equipos
      },
      error: (err) => {
        console.error('Error deleting team:', err);
      },
    });
  }
  

  getAvatarUrl(): string {
    return this.team?. avatarId? 'assets/img/avatars/avatar${this.team.avatarId}.png' : 'assets/img/avatars/default.png';
  }

  editAvatar() {
    this.modalService.displayModal('md', this.avatarSelectorModal);
  }

  closeAvatarSelector() {
    this.modalService.closeAll();
  }

  onAvatarSelected(newAvatarId: number) {
    if (this.team) {
      this.team.avatarId = newAvatarId;
      this.teamService.updateTeamField('avatarId', newAvatarId.toString()).subscribe({
        next: () => {
          this.triggerAlert('success', '¡Éxito!', 'El avatar ha sido actualizado correctamente.', 'Continuar');
          this.closeAvatarSelector();
        },
        error: (error: any) => {
          this.triggerAlert('error', 'Error', 'Hubo un problema al actualizar el avatar: ${error.message}');
        }
      });
    }
  }

  triggerAlert(type: 'time' | 'error' | 'success', title: string, message: string, buttonText: string = 'Cerrar') {
    this.alertType = type;
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertButtonText = buttonText;
    this.showAlert = true;
  }

  closeAlertModal() {
    this.showAlert = false;
  }
}