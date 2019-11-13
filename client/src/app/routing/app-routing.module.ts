import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { HomeComponent } from "../components/home/home.component";
import { RegisterComponent } from "../components/register/register.component";
import { AuthService } from "../services/auth.service";

export const routes: Routes = [
  { path: "home", component: HomeComponent },
  { path: "register", component: RegisterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthService]
})
export class AppRoutingModule {}