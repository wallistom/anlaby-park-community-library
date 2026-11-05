import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout.component';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        title: "Anlaby Park Community Library — Hull's first and only community-run library",
        loadComponent: () => import('./pages/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'whats-on',
        title: "What's On — Anlaby Park Community Library",
        loadComponent: () => import('./pages/whats-on.component').then((m) => m.WhatsOnComponent),
      },
      {
        path: 'activities',
        title: 'Activities & Clubs — Anlaby Park Community Library',
        loadComponent: () =>
          import('./pages/activities.component').then((m) => m.ActivitiesComponent),
      },
      {
        path: 'visit',
        title: 'Visit Us — Anlaby Park Community Library',
        loadComponent: () => import('./pages/visit.component').then((m) => m.VisitComponent),
      },
      {
        path: 'room-hire',
        title: 'Room Hire — Anlaby Park Community Library',
        loadComponent: () => import('./pages/room-hire.component').then((m) => m.RoomHireComponent),
      },
      {
        path: 'volunteer',
        title: 'Volunteer With Us — Anlaby Park Community Library',
        loadComponent: () =>
          import('./pages/volunteer.component').then((m) => m.VolunteerComponent),
      },
      {
        path: 'support',
        title: 'Support the Library — Anlaby Park Community Library',
        loadComponent: () => import('./pages/support.component').then((m) => m.SupportComponent),
      },
      {
        path: 'about',
        title: 'About the Trust — Anlaby Park Community Library',
        loadComponent: () => import('./pages/about.component').then((m) => m.AboutComponent),
      },
      {
        path: 'contact',
        title: 'Contact Us — Anlaby Park Community Library',
        loadComponent: () => import('./pages/contact.component').then((m) => m.ContactComponent),
      },
      {
        path: 'privacy',
        title: 'Privacy Policy — Anlaby Park Community Library',
        loadComponent: () => import('./pages/privacy.component').then((m) => m.PrivacyComponent),
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        title: 'Trustee sign in — Anlaby Park Community Library',
        loadComponent: () => import('./admin/sign-in.component').then((m) => m.SignInComponent),
      },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        title: 'Overview — Trustee area',
        loadComponent: () => import('./admin/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'events',
        canActivate: [adminGuard],
        title: 'Events — Trustee area',
        loadComponent: () =>
          import('./admin/manage-events.component').then((m) => m.ManageEventsComponent),
      },
      {
        path: 'hours',
        canActivate: [adminGuard],
        title: 'Opening hours — Trustee area',
        loadComponent: () =>
          import('./admin/manage-hours.component').then((m) => m.ManageHoursComponent),
      },
      {
        path: 'enquiries',
        canActivate: [adminGuard],
        title: 'Enquiries — Trustee area',
        loadComponent: () =>
          import('./admin/enquiries.component').then((m) => m.EnquiriesComponent),
      },
      {
        path: 'trustees',
        canActivate: [adminGuard],
        title: 'Who can sign in — Trustee area',
        loadComponent: () => import('./admin/trustees.component').then((m) => m.TrusteesComponent),
      },
    ],
  },
  {
    path: '**',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        title: 'Page not found — Anlaby Park Community Library',
        loadComponent: () => import('./pages/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
