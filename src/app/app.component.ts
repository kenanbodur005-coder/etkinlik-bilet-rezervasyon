import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from './layout/sidebar-nav.component';
import { TopbarComponent } from './layout/topbar.component';
import { ToastHostComponent } from './shared/components/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, TopbarComponent, ToastHostComponent],
  template: `
    <div class="app-shell">
      <app-sidebar-nav></app-sidebar-nav>
      <div class="content-area">
        <app-topbar></app-topbar>
        <main class="page-container">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <app-toast-host></app-toast-host>
  `,
})
export class AppComponent {}
