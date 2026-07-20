import { Directive, EmbeddedViewRef, Input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/enums';

/**
 * *appPermission="[UserRole.EVENT_MANAGER]" şeklinde kullanılır.
 * Kullanıcının rolü listede yoksa element DOM'a hiç eklenmez
 * (sadece gizlenmez), böylece yetkisiz alanlara erişim tamamen engellenir.
 */
@Directive({
  selector: '[appPermission]',
  standalone: true,
})
export class PermissionDirective {
  private allowedRoles: UserRole[] = [];
  private view: EmbeddedViewRef<unknown> | null = null;

  @Input() set appPermission(roles: UserRole[]) {
    this.allowedRoles = roles ?? [];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private auth: AuthService
  ) {
    effect(() => {
      this.auth.currentUser();
      this.updateView();
    });
  }

  private updateView(): void {
    const allowed = this.allowedRoles.length === 0 || this.auth.hasRole(...this.allowedRoles);
    if (allowed && !this.view) {
      this.view = this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (!allowed && this.view) {
      this.viewContainer.clear();
      this.view = null;
    }
  }
}
