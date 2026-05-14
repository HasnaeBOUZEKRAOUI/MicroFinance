<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles)
{
    // 1. Vérifier si l'utilisateur est connecté
    if (!auth()->check()) {
        return redirect('login');
    }

    // 2. Vérifier si le rôle de l'utilisateur est dans la liste autorisée
    $userRole = auth()->user()->role;
    
    if (in_array($userRole, $roles)) {
        return $next($request);
    }

    // 3. Rediriger ou bloquer si l'accès est refusé
    abort(403, "Vous n'avez pas l'autorisation d'accéder à cette page.");
}
}
