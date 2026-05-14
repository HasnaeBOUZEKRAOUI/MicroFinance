<?php

namespace App\Http\Middleware;

use Closure;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;


class CheckAuth
{
   
    public function handle(Request $request, Closure $next)
    {
         if (!auth()->check()) {
        return redirect('/login')->abort('Echec', ' echec de se connecter');
    }
   
    return $next($request);
    }
}
