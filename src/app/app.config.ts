import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { DemoDataService } from './core/services/demo-data.service';

function initializeDemoData(demoData: DemoDataService) {
  return () => demoData.seedIfNeeded();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDemoData,
      deps: [DemoDataService],
      multi: true,
    },
  ],
};
